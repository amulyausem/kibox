import { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

export const listEntering = (index: number) =>
  FadeIn.duration(280).delay(Math.min(index, 8) * 32);

export const listExiting = FadeOut.duration(180);

export const listLayout = LinearTransition.springify().damping(18).stiffness(180);
