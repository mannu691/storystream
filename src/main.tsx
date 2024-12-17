/*
 * Jobs
 */

import './jobs/selectNextStoryPart.js';
import './jobs/userLeveledUp.js';

import { Devvit } from '@devvit/public-api';

import { Router } from './posts/Router.js';


/*
 * Menu Actions
 */

import { installGame } from './actions/installGame.js';
import { newPinnedPost } from './actions/newPinnedPost.js';
import { updateGamePostPreview } from './actions/updateGamePostPreview.js';
import { expireGamePost } from './actions/expireGamePost.js';
import { progressStoryNow } from './actions/progressStoryNow.js';

/*
 * Triggers
 */
import { appUpgrade } from './triggers/appUpgrade.js';

// import { installSettings } from './forms/installSettings.js';

/*
 * Plugins
 */

Devvit.configure({
  redditAPI: true,
  redis: true,
  media: true,
});

/*
 * Custom Post
 */

Devvit.addCustomPostType({
  name: 'StoryStream',
  description: 'A Story Completion game',
  height: 'tall',
  render: Router,
});

/*
 * Settings
 */
// Devvit.addSettings(installSettings);

/*
 * Menu Actions
 */

// Subreddit
Devvit.addMenuItem(installGame);
// Devvit.addMenuItem(createTopWeeklyGamePost);
Devvit.addMenuItem(newPinnedPost);

// Posts
Devvit.addMenuItem(updateGamePostPreview);
Devvit.addMenuItem(expireGamePost);
Devvit.addMenuItem(progressStoryNow);

/*
 * Triggers
 */

Devvit.addTrigger(appUpgrade);


//TODO : DEBUG Actions [REMOVE IN PROD]
Devvit.addMenuItem({
  label: '[StoryStream][DEBUG] Delete ALL',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { ui, reddit, scheduler } = context;
    const appAccount = await reddit.getAppUser();
    let posts = reddit.getPostsByUser({
      username: appAccount.username,
      sort: 'new',
      limit: 100
    });
    const comments = await reddit.getCommentsByUser({
      username: appAccount.username,
      limit: 1000
    }).all();
    if (scheduler) {
      const jobs = await scheduler.listJobs();
      for (const job of jobs) {
        await scheduler.cancelJob(job.id);
      }
    }
    for (const comment of comments) {
      await comment.delete();
    }
    for await (const post of posts) {
      await post.delete();
    }

    ui.showToast("Deleted All");
  },
});
Devvit.addMenuItem({
  label: '[StoryStream][DEBUG] INFO',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    console.log('========== DEBUG INFO =========');
    (await context.scheduler?.listJobs()).forEach(async (job) => {
      console.log(`JOB : ${job.name} : ${job.id} : ${job.data}`);
    })
    console.log('==============================');
  },
});
export default Devvit;
