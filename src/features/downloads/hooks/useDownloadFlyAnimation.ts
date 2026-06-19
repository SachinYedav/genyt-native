import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';

export function useDownloadFlyAnimation() {
  const flyStartX = useSharedValue(0);
  const flyStartY = useSharedValue(0);
  const flyCategory = useSharedValue(0);
  const flyOpacity = useSharedValue(0);
  const flyProgress = useSharedValue(0);
  const headerScale = useSharedValue(1);

  const screenWidth = Dimensions.get('window').width;

  const flyStyle = useAnimatedStyle(() => {
    const endX = screenWidth - 120; // Target X coordinate (Downloads button)
    const endY = 50; // Target Y coordinate

    const currentX = flyStartX.value + flyProgress.value * (endX - flyStartX.value);
    // Parabolic arc
    const currentY = flyStartY.value + flyProgress.value * (endY - flyStartY.value) - Math.sin(flyProgress.value * Math.PI) * 150;

    const rotation = `${flyProgress.value * 360}deg`;
    const currentScale = 1 - flyProgress.value * 0.6;

    return {
      position: 'absolute',
      left: -24,
      top: -24,
      transform: [
        { translateX: currentX },
        { translateY: currentY },
        { scale: currentScale },
        { rotate: rotation }
      ],
      opacity: flyOpacity.value,
      zIndex: 9999,
      pointerEvents: 'none',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 20,
    } as any;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const videoIconStyle = useAnimatedStyle(() => ({ opacity: flyCategory.value === 0 ? 1 : 0, position: 'absolute' }));
  const audioIconStyle = useAnimatedStyle(() => ({ opacity: flyCategory.value === 1 ? 1 : 0, position: 'absolute' }));
  const imageIconStyle = useAnimatedStyle(() => ({ opacity: flyCategory.value === 2 ? 1 : 0, position: 'absolute' }));

  const triggerAnimation = (categoryIndex: number, startX: number, startY: number) => {
    flyStartX.value = startX;
    flyStartY.value = startY;
    flyCategory.value = categoryIndex; // 0: video, 1: audio, 2: thumbnail
    flyOpacity.value = 1;
    flyProgress.value = 0;

    flyProgress.value = withTiming(1, { duration: 700, easing: ReanimatedEasing.bezier(0.25, 0.1, 0.25, 1) }, (finished) => {
      if (finished) {
        flyOpacity.value = 0;
        headerScale.value = withSequence(
          withSpring(1.15, { damping: 12, stiffness: 250 }),
          withSpring(1, { damping: 12, stiffness: 250 })
        );
      }
    });
  };

  return {
    flyStyle,
    headerAnimatedStyle,
    videoIconStyle,
    audioIconStyle,
    imageIconStyle,
    triggerAnimation,
  };
}
