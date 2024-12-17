import type { Context } from '@devvit/public-api';
import { Devvit, useInterval, useState } from '@devvit/public-api';
import { Service } from '../../service/Service.js';
import Settings from '../../settings.json' assert { type: "json" };
import type { GamePostData, GameSettings, UserData } from '../../types.js';
import { StoryScreen } from './StoryScreen.js';
import { ResultsScreen } from './ResultsScreen.js';
import { createGamePostForm } from '../../forms/createGamePostForm.js';

interface GamePostProps {
  postData: GamePostData;
  userData: UserData | null;
  username: string | null;
  gameSettings: GameSettings;
}

export const GamePost = (props: GamePostProps, context: Context): JSX.Element => {
  const isAuthor = props.postData.authorUsername === props.username;
  const isFinished = !!props.postData.finished;
  const isExpired = !!props.postData.expired;

  const [currentStep, setCurrentStep] = useState<string>(
    isAuthor || isFinished || isExpired ? 'Results' : 'Prompt'
  );
  const creareStoryForm = createGamePostForm(context, props.username, props.gameSettings);
  // Steps map
  const steps: Record<string, JSX.Element> = {
    Prompt: (
      <StoryScreen {...props} />
    ),
    Results: (
      <ResultsScreen
        {...props}
        onCreate={() => context.ui.showForm(creareStoryForm)}
      />
    ),
  };
  return steps[currentStep] || (<text>Error: Step not found</text>);
};
