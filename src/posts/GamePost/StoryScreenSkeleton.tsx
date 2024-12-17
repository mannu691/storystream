import { Devvit } from '@devvit/public-api';

import { PixelText } from '../../components/PixelText.js';
import Settings from '../../settings.json' assert { type: "json" };
import { StyledButton } from '../../components/StyledButton.js';

interface StoryScreenSkeletonProps {
  storyPart: string;
  partLimit: number;
  currentCount: number;
  title: string;
}

export const StoryScreenSkeleton = (props: StoryScreenSkeletonProps): JSX.Element => {

  return (
    <blocks height="tall">
      <zstack width="100%" height="100%" alignment="center middle">
        <image
          imageHeight={1024}
          imageWidth={2048}
          height="100%"
          width="100%"
          url="background.png"
          description="Patterned Red background"
          resizeMode="cover"
        />
        <vstack height="92%" width="90%" backgroundColor={Settings.theme.primary} cornerRadius="medium" maxWidth="580px" grow></vstack>
        <vstack height="89%" width="85%" backgroundColor="#faf0f0" cornerRadius="medium" alignment="center" maxWidth="560px" grow>
          <zstack width="100%" backgroundColor={Settings.theme.primary} padding="medium" alignment="center" >
            <PixelText scale={2} color="white">CONTINUE THE STORY</PixelText>
          </zstack>
          <vstack width="100%" height="100%" padding="small" alignment="center">
            <text color="#6f2722" alignment="end" width="100%" weight="bold" size="large">{props.currentCount} / {props.partLimit}</text>
            <text color="black" width="100%" height="275px" alignment="center" overflow="ellipsis" wrap weight="bold" size="xlarge">{props.storyPart}</text>
            <spacer height="4px" />
            <PixelText scale={2} color={Settings.theme.primary}>LOADING...</PixelText>
          </vstack>
        </vstack>
      </zstack>
    </blocks>
  );
};
