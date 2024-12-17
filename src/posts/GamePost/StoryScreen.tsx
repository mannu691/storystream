import type { Context } from '@devvit/public-api';
import { Devvit } from '@devvit/public-api';

import { PixelText } from '../../components/PixelText.js';
import { Service } from '../../service/Service.js';
import Settings from '../../settings.json' assert { type: "json" };
import type { GamePostData, UserData } from '../../types.js';
import { StyledButton } from '../../components/StyledButton.js';

interface StoryScreenProps {
  postData: GamePostData;
  userData: UserData | null;
  username: string | null;
}

export const StoryScreen = (props: StoryScreenProps, context: Context): JSX.Element => {
  const service = new Service(context);

  const navigateToPinnedComment = async () => {
    const comment = await context.reddit.getCommentById(props.postData.pinnedCommentId);
    context.ui.navigateTo(comment);
  }
  let latestPart = props.postData.data[props.postData.data.length - 1][1];
  let partLimit = props.postData.partLimit;
  let currentlimit = props.postData.currentCount;

  return (

    <vstack height="100%" width="100%" alignment="center">
      <zstack width="100%" backgroundColor={Settings.theme.primary} padding="medium" alignment="center" >
        <PixelText scale={2} color="white">CONTINUE THE STORY</PixelText>
      </zstack>
      <vstack width="100%" height="100%" padding="small" alignment="center">
        <text color="#6f2722" alignment="end" width="100%" weight="bold" size="large">{currentlimit} / {partLimit}</text>
        <text color="black" width="100%" height="275px" alignment="center" overflow="ellipsis" wrap weight="bold" size="xlarge">{latestPart}</text>
        <spacer height="4px" />
        <StyledButton scale={2} width="80%" label="SUGGEST" onPress={navigateToPinnedComment} />
        <spacer height="4px" />
        <StyledButton scale={2} width="80%" label="VOTE" onPress={navigateToPinnedComment} />
      </vstack>
    </vstack>

  );
};
