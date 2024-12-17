import type { MenuItem } from '@devvit/public-api';

import { Service } from '../service/Service.js';
import { PostType, type PostId } from '../types.js';

export const expireGamePost: MenuItem = {
  label: '[StoryStream] Expire Story',
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
    await service.expirePost(event.targetId);
    context.ui.showToast("Story Post Expired!");
  },
};
