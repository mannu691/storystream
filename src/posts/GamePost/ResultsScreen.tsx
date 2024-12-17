import type { Context } from '@devvit/public-api';
import { Devvit, useAsync, useState } from '@devvit/public-api';


import { LoadingState } from '../../components/LoadingState.js';
import { PixelText } from '../../components/PixelText.js';
import { PointsToast } from '../../components/PointsToast.js';
import { Service } from '../../service/Service.js';
import Settings from '../../settings.json' assert { type: "json" };
import type { GamePostData } from '../../types.js';
import { abbreviateNumber, capitalize, obfuscateString } from '../../utils.js';
import { StyledButton } from '../../components/StyledButton.js';
import { LoadingStateSpinner } from '../../components/LoadingStateSpinner.js';


interface ResultsScreenProps {
  postData: GamePostData;
  username: string | null;
  onCreate: () => void;
}

export const ResultsScreen = (props: ResultsScreenProps, context: Context): JSX.Element => {
  const service = new Service(context);
  // const storyScale = (context.dimensions?.width ?? 0) > 343 ? "xxlarge" : 'xlarge'
  let title = "STORY ONGOING"
  if (props.postData.expired) title = "STORY EXPIRED"
  else if (props.postData.finished) title = "STORY FINISHED"
  const [page, setPage] = useState(0);
  const totalParts = props.postData.data.length;
  return (

    <vstack height="100%" width="100%" alignment="center">
      <zstack width="100%" backgroundColor={Settings.theme.primary} padding="medium" alignment="center" >
        <PixelText scale={2} color="white">{title}</PixelText>
      </zstack>
      <vstack width="100%" height="100%" padding="small" alignment="center">
        <text color="black" width="100%" height="275px" alignment="center" overflow="ellipsis" wrap weight="bold" size="xlarge">{props.postData.data[page][1]}</text>
        <spacer height="2px" />
        <text color={Settings.theme.primary} alignment="start" width="100%" weight="bold" size="large">by u/{props.postData.data[page][0]}</text>
        <spacer height="4px" />
        <hstack width="100%" height="40px" alignment="middle center">
          {
            page == 0 ?
              <StyledButton scale={2} width="48%" height="40px" appearance='secondary' label="Begin" />
              :
              <StyledButton scale={3} width="48%" height="40px" leadingIcon='arrow-left' onPress={() => { if (page > 0) setPage(page - 1); }} />
          }
          <spacer height="4px" grow />
          {
            page == totalParts - 1 ?
              <StyledButton scale={2} width="48%" height="40px" appearance='secondary' label="End" />
              :
              <StyledButton scale={3} width="48%" height="40px" leadingIcon='arrow-right' onPress={() => { if (page < totalParts - 1) setPage(page + 1); }} />
          }
        </hstack>
        <spacer height="8px" />
        <StyledButton scale={2} label="Make Your Own!" onPress={props.onCreate} />
      </vstack>
    </vstack>

  );
};
