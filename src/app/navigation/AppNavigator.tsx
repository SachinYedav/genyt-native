import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DownloadsScreen } from '@/features/downloads/DownloadsScreen';
import { LibraryScreen } from '@/features/history/LibraryScreen';
import { HistoryDetailScreen } from '@/features/history/HistoryDetailScreen';
import { WatchlistDetailScreen } from '@/features/history/WatchlistDetailScreen';
import { SavedPlaylistsDetailScreen } from '@/features/history/SavedPlaylistsDetailScreen';
import { HomeScreen } from '@/features/home/HomeScreen';
import { SearchScreen } from '@/features/search/SearchScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { TermsPrivacyScreen } from '@/features/settings/TermsPrivacyScreen';
import { LicensesScreen } from '@/features/settings/LicensesScreen';
import { LicenseDetailScreen } from '@/features/settings/LicenseDetailScreen';
import { ChannelScreen } from '@/features/channel/ChannelScreen';
import { PlaylistScreen } from '@/features/playlist/PlaylistScreen';

import { RootPlayerOverlay } from '@/features/watch/RootPlayerOverlay';
import { VideoDownloaderScreen } from '@/features/downloads/VideoDownloaderScreen';
import { ShortsScreen } from '@/features/shorts/ShortsScreen';
import { GlobalVideoActionSheet } from '@/shared/ui/GlobalVideoActionSheet';
import { GlobalOfflineToast } from '@/shared/ui/GlobalOfflineToast';
import { useTheme } from '@/shared/theme';
import type { RootStackParamList, TabsParamList } from './types';
import { useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { View } from 'react-native';
import { BottomTabBar } from './components/BottomTabBar';

import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

export function AppNavigator() {
  const { colors, isDark } = useTheme();
  const initNetwork = useNetworkStore(state => state.initialize);

  useEffect(() => {
    initNetwork();
  }, [initNetwork]);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      border: colors.border,
      primary: colors.brand,
      text: colors.text,
    },
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen 
          name="Shorts" 
          component={ShortsScreen} 
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} 
        />
        <Stack.Screen name="VideoDownloader" component={VideoDownloaderScreen} />
        <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
        <Stack.Screen name="WatchlistDetail" component={WatchlistDetailScreen} />
        <Stack.Screen name="SavedPlaylistsDetail" component={SavedPlaylistsDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
        <Stack.Screen name="Licenses" component={LicensesScreen} />
        <Stack.Screen name="LicenseDetail" component={LicenseDetailScreen} />
        <Stack.Screen name="Channel" component={ChannelScreen} />
        <Stack.Screen name="Playlist" component={PlaylistScreen} />

        </Stack.Navigator>
        <GlobalVideoActionSheet />
        <RootPlayerOverlay />
      </NavigationContainer>
      <GlobalOfflineToast />
    </View>
  );
}
function TabNavigator() {
  return (
    <Tabs.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="ShortsTab" component={ShortsScreen} />
      <Tabs.Screen name="Search" component={SearchScreen} />
      <Tabs.Screen name="Downloads" component={DownloadsScreen} />
      <Tabs.Screen name="Library" component={LibraryScreen} />
    </Tabs.Navigator>
  );
}
