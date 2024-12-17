import {
  Post,
  RedditAPIClient,
  RedisClient,
  Scheduler,
  SettingsClient,
  ZRangeOptions,
} from '@devvit/public-api';
import { Devvit } from '@devvit/public-api';

import { StoryScreenSkeleton } from '../posts/GamePost/StoryScreenSkeleton.js';
import Settings from '../settings.json' assert { type: "json" };
import {
  CommentId,
  GamePostData,
  GameSettings,
  PinnedPostData,
  PostId,
  PostType,
  ScoreBoardEntry,
  UserData,
  UserId,
} from '../types.js';
import { getLevelByScore } from '../utils.js';
import { finishedStoryComment } from '../data/content.js';

// Service that handles the backbone logic for the application
// This service is responsible for:
// * Storing and fetching post data for stories
// * Storing and fetching the score board
// * Storing and fetching user settings
// * Storing and fetching game settings

export class Service {
  readonly redis: RedisClient;
  readonly reddit?: RedditAPIClient;
  readonly scheduler?: Scheduler;
  readonly settings?: SettingsClient;

  constructor(context: { redis: RedisClient; reddit?: RedditAPIClient; scheduler?: Scheduler; settings?: SettingsClient }) {
    this.redis = context.redis;
    this.reddit = context.reddit;
    this.scheduler = context.scheduler;
    this.settings = context.settings;

  }

  readonly tags = {
    scores: 'default',
  };

  readonly keys = {
    gameSettings: 'game-settings',
    postData: (postId: PostId) => `post:${postId}`,
    scores: `scores:${this.tags.scores}`,
    userData: (username: string) => `users:${username}`,
    userStories: (username: string) => `user-stories:${username}`,
  };

  async progressStory(postId: PostId): Promise<boolean> {
    if (!this.reddit || !this.scheduler) {
      console.error('Reddit API client or Scheduler not available in Service');
      return false;
    }
    const story = await this.getGamePost(postId)
    if (story.expired || story.postType != PostType.GAME || story.finished) throw "What the Heck dude!";
    const topComment = (await this.reddit!
      .getComments({
        commentId: story.pinnedCommentId,
        postId: postId,
        limit: 1,
        pageSize: 1,
        sort: 'top'
      })
      .all())[0];

    if (!topComment) {
      return false;
    }
    const finished = story.currentCount + 1 >= story.partLimit
    let commentId = story.pinnedCommentId;

    try {
      await (await this.reddit?.getCommentById(story.pinnedCommentId))?.edit({ text: '[Completed]' });
      let comment;
      if (finished) {
        comment = await this.reddit?.submitComment({
          id: postId,
          text: finishedStoryComment(story),
        });
      } else {
        comment = await this.reddit?.submitComment({
          id: postId,
          text: Settings.comments.newStory,
        });
      }
      await comment?.distinguish(true);
      if (comment) commentId = comment.id;
    } catch (_) { }
    story.data.push([topComment.authorName, topComment.body])
    await Promise.all([
      this.redis.hSet(this.keys.postData(postId), { data: JSON.stringify(story.data), currentCount: (story.currentCount + 1).toString(), pinnedCommentId: commentId }),
      this.incrementUserScore(story.authorUsername, Settings.authorRewardForNewPart),
      this.incrementUserScore(topComment.authorName, Settings.userRewardForPartSelected),
    ])

    if (story.currentCount + 1 >= story.partLimit && story.schedulerId) {
      try {
        await this.scheduler?.cancelJob(story.schedulerId);
      } catch (_) { }
    } else if (!finished) {
      await this.newSchedulerForStory(postId, 6);
    }
    return true;
  }

  /*
   * Scores
   *
   * A sorted set for the in-game points and scoreboard unit
   * - Member: Username
   * - Score: Number of points currently held
   */

  async getScores(maxLength: number = 10): Promise<ScoreBoardEntry[]> {
    const options: ZRangeOptions = { reverse: true, by: 'rank' };
    return await this.redis.zRange(this.keys.scores, 0, maxLength - 1, options);
  }

  async getUserScore(username: string | null): Promise<{
    rank: number;
    score: number;
  }> {
    const defaultValue = { rank: -1, score: 0 };
    if (!username) return defaultValue;
    try {
      const [rank, score] = await Promise.all([
        this.redis.zRank(this.keys.scores, username),
        // TODO: Remove .zScore when .zRank supports the WITHSCORE option
        this.redis.zScore(this.keys.scores, username),
      ]);
      return {
        rank: rank === undefined ? -1 : rank,
        score: score === undefined ? 0 : score,
      };
    } catch (error) {
      if (error) {
        console.error('Error fetching user score board entry', error);
      }
      return defaultValue;
    }
  }

  async incrementUserScore(username: string, amount: number): Promise<number> {
    if (this.scheduler === undefined) {
      console.error('Scheduler not available in Service');
      return 0;
    }
    const key = this.keys.scores;
    const prevScore = (await this.redis.zScore(key, username)) ?? 0;
    const nextScore = await this.redis.zIncrBy(key, username, amount);
    const prevLevel = getLevelByScore(prevScore);
    const nextLevel = getLevelByScore(nextScore);
    if (nextLevel.rank > prevLevel.rank) {
      await this.scheduler.runJob({
        name: 'USER_LEVEL_UP',
        data: {
          username,
          score: nextScore,
          prevLevel,
          nextLevel,
        },
        runAt: new Date(),
      });
    }

    return nextScore;
  }

  /*
   * User Stories
   *
   * All shared stories are stored in a sorted set for each player:
   * - Member: Post ID
   * - Score: Unix epoch time
   */

  async getUserStories(
    username: string,
    options?: {
      min?: number;
      max?: number;
    }
  ): Promise<PostId[]> {
    try {
      const key = this.keys.userStories(username);
      const start = options?.min ?? 0;
      const stop = options?.max ?? -1;
      const data = await this.redis.zRange(key, start, stop, {
        reverse: true,
        by: 'rank',
      });
      if (!data || data === undefined) return [];
      return data.map((value) => value.member as PostId);
    } catch (error) {
      if (error) {
        console.error('Error fetching user stories:', error);
      }
      return [];
    }
  }

  async expirePost(postId: PostId): Promise<void> {
    const post = await this.getGamePost(postId);
    if (post.schedulerId) await this.scheduler?.cancelJob(post.schedulerId);
    await this.redis.hSet(this.keys.postData(postId), { expired: 'true', schedulerId: '' })
  }

  /*
   * Post data
   */

  async getPostType(postId: PostId) {
    const key = this.keys.postData(postId);
    const postType = await this.redis.hGet(key, 'postType');
    const defaultPostType = 'game';
    return (postType ?? defaultPostType) as PostType;
  }

  /*
   * Game Post data
   */

  async getGamePost(postId: PostId): Promise<GamePostData> {
    const postData = await this.redis.hGetAll(this.keys.postData(postId))
    return {
      postId: postId,
      postType: postData.postType as PostType,
      authorUsername: postData.authorUsername as UserId,
      schedulerId: postData.schedulerId,
      expired: postData.expired === 'true',
      pinnedCommentId: postData.pinnedCommentId,
      title: postData.title ?? '',
      data: JSON.parse(postData.data ?? '[]') as [[string, string]],
      partLimit: parseInt(postData.partLimit) ?? 0,
      currentCount: parseInt(postData.currentCount) ?? 0,
      date: parseInt(postData.date),
      finished: parseInt(postData.partLimit) <= parseInt(postData.currentCount),
    };
  }

  async getGamePosts(postIds: PostId[]): Promise<Pick<GamePostData, 'postId' | 'data'>[]> {
    return await Promise.all(
      postIds.map(async (postId) => {
        const key = this.keys.postData(postId);
        const data = await this.redis.hGet(key, 'data');
        return {
          postId,
          data: JSON.parse(data ?? '[]') as [[string, string]],
        };
      })
    );
  }

  async updateGamePostPreview(
    postId: PostId,
    game: GamePostData,
  ): Promise<void> {
    const post = await this.reddit?.getPostById(postId);
    try {
      await post?.setCustomPostPreview(() => (
        <StoryScreenSkeleton
          storyPart={game.data[game.currentCount - 1][1]}
          partLimit={game.partLimit}
          currentCount={game.currentCount}
          title={game.title}
        />
      ));
    } catch (error) {
      console.error('Failed updating story preview', error);
    }
  }

  async newSchedulerForStory(postId: PostId, hours: number, first: boolean = true): Promise<void> {
    try {
      const post = await this.getGamePost(postId);
      if (post.schedulerId) await this.scheduler?.cancelJob(post.schedulerId);
    } catch (_) {
    }
    const inHours = new Date(Date.now() + hours * 60 * 60 * 1000);
    const job = await this.scheduler?.runJob({
      name: 'SELECT_NEXT_STORY_PART',
      data: {
        postId: postId,
        first: first,
      },
      runAt: inHours,
    });
    await this.redis.hSet(this.keys.postData(postId), { schedulerId: job ?? '' })
  }

  /*
   * Handle story submissions
   */

  async submitStoryPost(data: {
    postId: PostId;
    title: string;
    origin: string;
    partLimit: number,
    authorUsername: string;
    subreddit: string;
  }): Promise<void> {
    if (!this.scheduler || !this.reddit) {
      console.error('submitStoryPost: Scheduler/Reddit API client not available');
      return;
    }
    const key = this.keys.postData(data.postId);
    const comment = await this.reddit.submitComment({
      id: data.postId,
      text: Settings.comments.newStory,
    });
    await comment.distinguish(true);
    await Promise.all([
      // Save post object
      this.redis.hSet(key, {
        postId: data.postId,
        title: data.title,
        pinnedCommentId: comment.id,
        data: JSON.stringify([[data.authorUsername, data.origin]]),
        partLimit: data.partLimit.toString(),
        currentCount: '1',
        authorUsername: data.authorUsername,
        date: Date.now().toString(),
        postType: PostType.GAME,
      }),

      // Save the post to the user's stories
      this.redis.zAdd(this.keys.userStories(data.authorUsername), {
        member: data.postId,
        score: Date.now(),
      }),
      this.newSchedulerForStory(data.postId, 6),
      // Give points to the user for posting
      this.incrementUserScore(data.authorUsername, Settings.authorRewardForSubmit),
    ]);
  }

  /*
   * Game settings
   */

  async storeGameSettings(settings: { [field: string]: string }): Promise<void> {
    const key = this.keys.gameSettings;
    await this.redis.hSet(key, settings);
  }

  async getGameSettings(): Promise<GameSettings> {
    const key = this.keys.gameSettings;
    return (await this.redis.hGetAll(key)) as GameSettings;
  }


  /*
   * Pinned Post
   */

  async savePinnedPost(postId: PostId): Promise<void> {
    const key = this.keys.postData(postId);
    await this.redis.hSet(key, {
      postId,
      postType: PostType.PINNED,
    });
  }

  async getPinnedPost(postId: PostId): Promise<PinnedPostData> {
    const key = this.keys.postData(postId);
    const postType = await this.redis.hGet(key, 'postType');
    return {
      postId,
      postType: postType as PostType ?? PostType.PINNED,
    };
  }

  /*
   * User Data and State Persistence
   */

  async saveUserData(
    username: string,
    data: { [field: string]: string | number | boolean }
  ): Promise<void> {
    const key = this.keys.userData(username);
    const stringConfig = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)])
    );
    await this.redis.hSet(key, stringConfig);
  }

  async getUser(username: string | null, postId: PostId): Promise<UserData | null> {
    if (!username) return null;
    const data = await this.redis.hGetAll(this.keys.userData(username));
    const user = await this.getUserScore(username);
    const level = getLevelByScore(user.score);
    const parsedData: UserData = {
      score: user.score,
      levelRank: data.levelRank ? parseInt(data.levelRank) : level.rank,
      levelName: data.levelName ?? level.name,
    };
    return parsedData;
  }
  async getUsernameWithCache(userId: string | undefined) {
    if (!userId || !this.redis || !this.reddit) return null; // Return early if no userId
    const cacheKey = 'cache:userId-username';
    const cache = await this.redis.hGet(cacheKey, userId);
    if (cache) {
      return cache;
    } else {
      const user = await this.reddit.getUserById(userId);
      if (user) {
        await this.redis.hSet(cacheKey, {
          [userId]: user.username,
        });
        return user.username;
      }
    }
    return null;
  };
}
