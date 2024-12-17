import { Context, Devvit, useForm, type FormOnSubmitEvent } from "@devvit/public-api";

import { Service } from "../service/Service.js";
import { StoryScreenSkeleton } from "../posts/GamePost/StoryScreenSkeleton.js";
import { GameSettings } from "../types.js";
import Settings from '../settings.json' assert { type: "json" };

export const createGamePostForm = (context: Context, username: string | null, gameSettings: GameSettings) => useForm(
  {
    title: "Create a new Story",
    description:
      "create a new amazing story",
    fields: [
      {
        type: 'string',
        name: 'title',
        label: 'Story Title',
        placeholder: "Title for your Amazing story",
        helpText: "Title for your story , optional",
      },
      {
        type: 'string',
        name: 'origin',
        label: 'Beginning of story',
        placeholder: "Beginning of your Amazing story",
        helpText: "Origin/Start of your story, which others will continue off of",
        required: true,
      },
      {
        type: 'number',
        name: 'partLimit',
        label: 'Total Parts',
        defaultValue: 3,
        placeholder: "Maximum Story parts",
        helpText: "Number of parts your story will have. [2-6]",
        required: true,
      },
    ],
    acceptLabel: "Create",
    cancelLabel: "Cancel",
  },
  async (values) => {
    const service = new Service(context);
    if (!username) {
      context.ui.showToast('Please log in to post');
      return;
    }
    // Add a temporary lock key to prevent duplicate posting.
    // This lock will expire after 5 seconds.
    // If the lock is already set return early.
    const lockKey = `locked:${username}`;
    const locked = await context.redis.get(lockKey);
    if (locked === 'true') return;
    const lockoutPeriod = 5000; // 5 seconds
    await context.redis.set(lockKey, 'true', {
      nx: true,
      expiration: new Date(Date.now() + lockoutPeriod),
    });

    //TODO make this customizable
    if (values.partLimit < 2 || values.partLimit > 6) {
      context.ui.showToast('Total Parts should be between 2 and 6!');
      return;
    }
    if (values.origin.length < Settings.minimumOriginLength) {
      context.ui.showToast('Your Origin is too short!');
      return;
    }
    const post = await context.reddit.submitPost({
      title: `Continue The Story : ${values.title ?? ''}`,
      subredditName: gameSettings.subredditName,
      preview: (
        //TODO change this
        <StoryScreenSkeleton
          storyPart={values.origin}
          partLimit={values.partLimit}
          currentCount={1}
          title={values.title ?? ''}

        />
      ),
    });

    await service.submitStoryPost({ title: values.title ?? '', postId: post.id, origin: values.origin, authorUsername: username, partLimit: values.partLimit, subreddit: gameSettings.subredditName })
    context.ui.navigateTo(post)
  }
);

