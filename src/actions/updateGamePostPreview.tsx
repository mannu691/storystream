import type { MenuItem } from '@devvit/public-api';

import { Service } from '../service/Service.js';
import { PostType, type PostId } from '../types.js';

export const updateGamePostPreview: MenuItem = {
  label: '[StoryStream] Update Post preview',
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

    const [game, user] = await Promise.all([
      service.getGamePost(postId),
      context.reddit.getCurrentUser(),
    ]);

    if (game.authorUsername !== user?.username) {
      context.ui.showToast('Not the author');
      return;
    }

    await service.updateGamePostPreview(
      postId,
      game,
    );
    context.ui.showToast('Updated Post Preview');
  },
};
