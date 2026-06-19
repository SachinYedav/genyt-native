import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '@/store/useNetworkStore';
import { AppText } from '@/shared/ui/AppText';
import { useTheme, typography, spacing } from '@/shared/theme';

export function GlobalOfflineToast() {
  const isOffline = useNetworkStore((state) => state.isOffline);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [toastStatus, setToastStatus] = useState<'hidden' | 'offline' | 'back-online'>('hidden');
  const height = useSharedValue(0);
  const previousOffline = useRef(isOffline);

  const TOAST_HEIGHT = (insets.bottom || 0) + 20;

  useEffect(() => {
    // If transitioning from Offline to Online
    if (previousOffline.current === true && isOffline === false) {
      setToastStatus('back-online');

      // Keep it visible for 3 seconds then hide
      const timer = setTimeout(() => {
        height.value = withTiming(0, {
          duration: 300,
          easing: Easing.in(Easing.cubic),
        }, () => {
          runOnJS(setToastStatus)('hidden');
        });
      }, 3000);

      previousOffline.current = isOffline;
      return () => clearTimeout(timer);
    }
    // If it becomes Offline
    else if (isOffline === true) {
      setToastStatus('offline');
      height.value = withTiming(TOAST_HEIGHT, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      previousOffline.current = isOffline;
    }
  }, [isOffline, TOAST_HEIGHT, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const backgroundColor = toastStatus === 'back-online' ? colors.success : colors.surfaceMuted;
  const text = toastStatus === 'back-online' ? 'Back online' : 'No connection';

  if (toastStatus === 'hidden') {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle, { backgroundColor: colors.background }]}>
      <View style={[styles.toastBar, { backgroundColor }]}>
        <AppText style={{ color: colors.white, fontWeight: '500', fontSize: typography.captionLg }}>
          {text}
        </AppText>
      </View>
      <View style={{ height: insets.bottom }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  toastBar: {
    width: '100%',
    paddingVertical: 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
