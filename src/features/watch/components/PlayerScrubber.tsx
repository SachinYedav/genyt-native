import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { GenytVideoPlayerRef } from '../../../../modules/genyt-video-player/src';

interface PlayerScrubberProps {
  playerRef: React.RefObject<GenytVideoPlayerRef | null>;
  currentTime: number;
  duration: number;
  bufferedPosition: number;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function PlayerScrubber({ playerRef, currentTime, duration, bufferedPosition, onInteractionStart, onInteractionEnd }: PlayerScrubberProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [displayTime, setDisplayTime] = useState('0:00');
  const [durationText, setDurationText] = useState('0:00');

  // Shared values for smooth animated progress bar
  const progressFraction = useSharedValue(0);
  const trackWidthRef = useRef(0);

  // Sync animated progress with playback position (smooth with withTiming)
  React.useEffect(() => {
    if (!isScrubbing && duration > 0) {
      const fraction = currentTime / duration;
      // Animate to target position over 100ms for smooth interpolation
      progressFraction.value = withTiming(fraction, { duration: 120 });
      setDisplayTime(formatTime(currentTime));
    }
    setDurationText(formatTime(duration));
  }, [currentTime, isScrubbing, duration]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      setIsScrubbing(true);
      onInteractionStart();
      playerRef.current?.pause()?.catch?.(() => { });
    })
    .onUpdate((event) => {
      const tw = trackWidthRef.current;
      if (tw <= 0) return;
      let fraction = event.x / tw;
      if (fraction < 0) fraction = 0;
      if (fraction > 1) fraction = 1;
      // Direct set (no animation) during scrub for responsive feel
      progressFraction.value = fraction;
      setDisplayTime(formatTime(fraction * duration));
    })
    .onEnd(() => {
      const newTime = progressFraction.value * duration;
      playerRef.current?.seekTo(newTime)?.catch?.(() => { }); // Send in sec
      playerRef.current?.play()?.catch?.(() => { });
      setIsScrubbing(false);
      onInteractionEnd();
    });

  // Animated styles that interpolate smoothly between time updates
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progressFraction.value * 100}%`,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    left: `${progressFraction.value * 100}%`,
  }));

  const onTrackLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  return (
    <View style={styles.container}>
      <AppText variant="caption" style={styles.timeText}>
        {displayTime}
      </AppText>

      <GestureDetector gesture={panGesture}>
        <View style={styles.trackContainer} onLayout={onTrackLayout}>
          <View style={styles.trackBackground} />
          <Animated.View style={[styles.trackFill, fillStyle]} />
          <Animated.View style={[styles.knob, knobStyle]} />
        </View>
      </GestureDetector>

      <AppText variant="caption" style={styles.timeText}>
        {durationText}
      </AppText>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: colors.white,
    width: 42,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  trackContainer: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  trackFill: {
    height: 3,
    backgroundColor: colors.brand,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  knob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brand,
    position: 'absolute',
    marginLeft: -8,
    top: 7,
  },
});
