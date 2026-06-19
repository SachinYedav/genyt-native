import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface PlayerGesturesProps {
  children: React.ReactNode;
  onSingleTap: () => void;
  onDoubleTapLeft: () => void;
  onDoubleTapRight: () => void;
}

export function PlayerGestures({
  children,
  onSingleTap,
  onDoubleTapLeft,
  onDoubleTapRight,
}: PlayerGesturesProps) {
  const { width } = Dimensions.get('window');

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(onSingleTap)();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((event) => {
      // If tap is on the left half of the screen, seek backward. Otherwise forward.
      if (event.absoluteX < width / 2) {
        runOnJS(onDoubleTapLeft)();
      } else {
        runOnJS(onDoubleTapRight)();
      }
    });

  // Double tap has priority over single tap. If double tap fails, single tap fires.
  const gestures = Gesture.Exclusive(doubleTap, singleTap);

  return (
    <GestureDetector gesture={gestures}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});