import { Composition } from 'remotion';
import { Walkthrough, TOTAL_FRAMES } from './Walkthrough';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Walkthrough"
      component={Walkthrough}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
