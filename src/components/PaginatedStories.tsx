import { Devvit, useState } from '@devvit/public-api';

import Settings from '../settings.json' assert { type: "json" };
import type { CollectionData, PostId } from '../types.js';
import { StyledButton } from './StyledButton.js';
import { Stories } from './Stories.js';

interface PaginatedStoriesProps {
  stories:
  | {
    postId: PostId;
    data: [[string, string]]
  }[]
  | CollectionData[]
  | null;
  storiesPerRow: number;
  ctaButtonEl: JSX.Element;
}

const DEFAULT_TILE_SIZE = 88;

export const PaginatedStories: Devvit.BlockComponent<PaginatedStoriesProps> = ({
  stories,
  storiesPerRow,
  ctaButtonEl,
}) => {
  if (stories?.length === 0) {
    return null;
  }

  const rowsPerPage = 3;
  const [paginationOffset, setPaginationOffset] = useState(0);
  const rows = stories ? Math.ceil(stories.length / storiesPerRow) : 0;
  const hasOverflow = paginationOffset + rowsPerPage < rows;

  const gridWidth = storiesPerRow * (DEFAULT_TILE_SIZE + 4) + (storiesPerRow - 1) * 8;
  const cutOffWidth = gridWidth;

  return (
    <vstack grow width="100%" alignment="center">
      <spacer height="24px" />

      <Stories
        stories={stories}
        rowsPerPage={rowsPerPage}
        storiesPerRow={storiesPerRow}
        paginationOffset={paginationOffset}
      ></Stories>

      {hasOverflow && (
        <vstack width={`${cutOffWidth}px`} height="4px" backgroundColor={Settings.theme.tertiary} />
      )}

      <spacer grow />

      {/* Footer */}
      <hstack gap="small" width={`${gridWidth}px`} alignment="center">
        {ctaButtonEl}
        {(hasOverflow || paginationOffset > 0) && <spacer grow />}
        {paginationOffset > 0 && (
          <StyledButton
            leadingIcon="arrow-up"
            onPress={() => setPaginationOffset((x) => x - rowsPerPage)}
            width="32px"
            height="32px"
          />
        )}
        {hasOverflow && (
          <StyledButton
            leadingIcon="arrow-down"
            onPress={() => setPaginationOffset((x) => x + rowsPerPage)}
            width="32px"
            height="32px"
          />
        )}
      </hstack>

      <spacer height="20px" />
    </vstack>
  );
};
