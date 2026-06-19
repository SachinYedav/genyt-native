import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, PlaySquare, Search, FolderDown, CircleUserRound } from 'lucide-react-native';

import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';

// Map route names to Icons and Labels
const TAB_CONFIG: Record<string, { label: string; Icon: any }> = {
  Home: { label: 'Home', Icon: Home },
  ShortsTab: { label: 'Shorts', Icon: PlaySquare },
  Search: { label: 'Search', Icon: Search },
  Downloads: { label: 'Downloads', Icon: FolderDown },
  Library: { label: 'You', Icon: CircleUserRound },
};

const TabItem = ({ route, isFocused, onPress, colors, isDark, styles }: any) => {
  const config = TAB_CONFIG[route.name];
  if (!config) return null;

  const { Icon, label } = config;

  // Reanimated value for background pill (0 to 1)
  const activeAnim = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    // Ultra-Smooth & Premium Spring
    activeAnim.value = withSpring(isFocused ? 1 : 0, {
      damping: 16,
      stiffness: 120,
      mass: 0.8,
    });
  }, [isFocused, activeAnim]);

  // Only Background Pill Animates
  const bgAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: activeAnim.value,
      transform: [{ scale: activeAnim.value === 0 ? 0.5 : activeAnim.value }],
    };
  });

  return (
    <Pressable style={styles.tabItem} onPress={onPress}>
      <View style={styles.tabContent}>
        <View style={styles.iconContainer}>
          {/* Animated Background Pill */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.surfaceMuted,
                borderRadius: radius.full,
              },
              bgAnimatedStyle,
            ]}
          />

          {/* Stable Icon */}
          <Icon
            size={24}
            color={isFocused ? colors.text : colors.textMuted}
            strokeWidth={isFocused ? 2.5 : 2}
          />
        </View>

        {/* Text with dynamic weight */}
        <AppText
          style={[
            styles.tabText,
            {
              color: isFocused ? colors.text : colors.textMuted,
              fontWeight: isFocused ? '700' : '500',
              marginTop: 4,
            },
          ]}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
};

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  // Ensure there's proper safe padding at the bottom
  const bottomPadding = insets.bottom > 0 ? insets.bottom : spacing.md;

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: bottomPadding,
          height: 56 + bottomPadding,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            colors={colors}
            isDark={isDark}
            styles={styles}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    elevation: 15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: radius.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: typography.captionSm,
    letterSpacing: 0.2,
  },
});
