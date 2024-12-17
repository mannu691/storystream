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

export default Devvit;
