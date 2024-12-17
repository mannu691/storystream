import { Devvit } from '@devvit/public-api';

import type { CollectionData, PostId } from '../types.js';
interface PaginatedStoriesProps {
  stories:
  | {
    postId: PostId;
    data: [[string, string]];
  }[]
  | CollectionData[]
  | null;
  storiesPerRow: number;
  rowsPerPage: number;
  paginationOffset: number;
}

export const Stories: Devvit.BlockComponent<PaginatedStoriesProps> = (
  { stories, rowsPerPage, storiesPerRow, paginationOffset },
  context
) => {
  if (stories?.length === 0) {
    return null;
  }

  const storiesByPage = (stories ?? [])
    .slice(paginationOffset * storiesPerRow, (paginationOffset + rowsPerPage + 1) * storiesPerRow)
    .map((story) => (
      <vstack onPress={async () =>
        context.reddit.getPostById(story.postId).then((post) => {
          if (!post) {
            context.ui.showToast('Post not found');
            return;
          }
          return context.ui.navigateTo(post);
        })
      } border='thick' borderColor='#e0e0e0' cornerRadius='medium' padding='xsmall' alignment='center middle'>
        <text color="black" alignment="center" width={'100%'} overflow="ellipsis" weight="bold" size="xxlarge">{story.data[0][1]}</text>
      </vstack>
    ));

  const storyRows = [];
  for (let i = 0; i < storiesByPage.length; i += storiesPerRow) {
    const elements = storiesByPage.slice(i, i + storiesPerRow);
    storyRows.push(<hstack gap="small" padding='small'>{elements}</hstack>);
  }

  return (
    <vstack grow gap="small">
      {storyRows.slice(paginationOffset, paginationOffset + rowsPerPage + 1)}
    </vstack>
  );
};
