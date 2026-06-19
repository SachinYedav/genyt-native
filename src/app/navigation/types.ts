import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  Home: undefined;
  ShortsTab: undefined;
  Search: undefined;
  Downloads: undefined;
  Library: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  Shorts: { initialIndex: number; initialShorts: import('@/entities/video/types').VideoSummary[] };
  VideoDownloader: { videoId: string };
  HistoryDetail: { filter?: 'videos' | 'shorts' };
  WatchlistDetail: { filter?: 'videos' | 'shorts' };
  Settings: undefined;
  TermsPrivacy: undefined;
  Licenses: undefined;
  LicenseDetail: { licenseId: string; licenseName: string; licenseText: string };
  Channel: { id: string };
  Playlist: { id: string };
  SavedPlaylistsDetail: undefined;
};
