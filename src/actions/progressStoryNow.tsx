import type { MenuItem } from '@devvit/public-api';

import { Service } from '../service/Service.js';
import { PostType, type PostId } from '../types.js';

export const progressStoryNow: MenuItem = {
  label: '[StoryStream] Progess Story Now!',
  location: 'post',
  forUserType: 'moderator',
  postFilter: 'currentApp',
  onPress: async (event, context) => {
    const service = new Service(context);
    const postId = event.targetId as PostId;
    const postType = await service.getPostType(postId);
    if (postType !== PostType.GAME) {
      context.ui.showToast('Not a story post');
      return;
    }
    try {
      const res = await service.progressStory(event.targetId);
      if (res) {
        context.ui.showToast("Next Story part selected!");
      } else {
        context.ui.showToast("Next Story part couldn't be selected!");
      }
    } catch (error) {
      context.ui.showToast("Next Story part couldn't be selected!");

    }
  },
};
