import { type FlairTextColor } from "@devvit/public-api";

/*
 * ID Identifiers
 */

export type CommentId = `t1_${string}`;
export type UserId = `t2_${string}`;
export type PostId = `t3_${string}`;
export type SubredditId = `t5_${string}`;

export type GameSettings = {
  subredditName: string;
};

export enum PostType {
  GAME = "game",
  // COLLECTION = "collection",
  PINNED = "pinned",
}

// Base post data
export type PostData = {
  postId: PostId;
  postType: PostType;
};

// Game post
export type GamePostData = PostData & {
  authorUsername: UserId;
  pinnedCommentId: string;
  partLimit: number;
  currentCount: number;
  title: string;
  data: [[string, string]]
  schedulerId: string | null,
  date: number;
  expired: boolean;
  finished: boolean;
};

// Collections
export type CollectionData = Pick<
  GamePostData, "postId" | "data" | "authorUsername"
>;

// export type CollectionPostData = PostData & {
//   data: CollectionData[];
//   timeframe: string;
// };

// Pinned post
export type PinnedPostData = PostData;

export type UserData = {
  score: number;
  levelRank: number;
  levelName: string;
  // storyCount: number;
};

/*
 * Progression
 */

export type Level = {
  rank: number;
  name: string;
  min: number;
  max: number;
  backgroundColor: string;
  textColor: FlairTextColor;
  extraTime: number;
};


export type ScoreBoardEntry = {
  member: string;
  score: number;
  description?: string;
};
