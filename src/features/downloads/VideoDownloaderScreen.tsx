import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FileVideo, Headphones, Image as ImageIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AnimatedReanimated from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import type { RootStackParamList } from '@/app/navigation/types';
import type { MediaFormat } from '@/entities/video/types';
import { useTheme, spacing, radius, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { startDownload } from '@/services/downloads/downloadService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DownloaderSkeleton } from './components/DownloaderSkeleton';
import { DownloaderHeader } from './components/DownloaderHeader';
import { VideoContextCard } from './components/VideoContextCard';
import { FormatFilterBar } from './components/FormatFilterBar';
import { DownloaderErrorState } from './components/DownloaderErrorState';
import { FormatCard, type EnhancedMediaFormat } from './components/FormatCard';

import { useDownloadFlyAnimation } from './hooks/useDownloadFlyAnimation';
import { useVideoFormats } from './hooks/useVideoFormats';

type VideoDownloaderScreenProps = NativeStackScreenProps<RootStackParamList, 'VideoDownloader'>;
type TabOption = 'video' | 'audio' | 'thumbnail';

export function VideoDownloaderScreen({ navigation, route }: VideoDownloaderScreenProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabOption>('video');
  const { video, detailsQuery, refetch, activeFormats, counts } = useVideoFormats(route.params.videoId, activeTab);
  const {
    flyStyle,
    headerAnimatedStyle,
    videoIconStyle,
    audioIconStyle,
    imageIconStyle,
    triggerAnimation,
  } = useDownloadFlyAnimation();

  const handleDownload = useCallback((format: MediaFormat, startX: number, startY: number) => {
    if (!video) return;
    const thumbnailUrlUrl = (video.thumbnailAsset as any)?.uri ?? video.thumbnailUrl;
    startDownload(video.id, video.title, format, thumbnailUrlUrl);

    const categoryIndex = format.category === 'video' ? 0 : format.category === 'audio' ? 1 : 2;
    triggerAnimation(categoryIndex, startX, startY);
  }, [video, triggerAnimation]);

  const renderItem = useCallback(({ item }: { item: EnhancedMediaFormat }) => (
    <FormatCard
      item={item}
      activeTab={activeTab}
      colors={colors}
      isDark={isDark}
      onDownload={handleDownload}
    />
  ), [activeTab, colors, isDark, handleDownload]);

  const thumbnailUrl = video ? ((video.thumbnailAsset as any)?.uri ?? video.thumbnailUrl) : null;

  return (
    <Screen padded={false} safeAreaEdges={['bottom']}>
      <AnimatedReanimated.View style={flyStyle}>
        <View style={[styles.formatIconContainer, { backgroundColor: colors.surface, elevation: 5, shadowColor: colors.black, shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 }]}>
          <AnimatedReanimated.View style={videoIconStyle}>
            <FileVideo color={colors.brand} size={24} />
          </AnimatedReanimated.View>
          <AnimatedReanimated.View style={audioIconStyle}>
            <Headphones color={colors.blue} size={24} />
          </AnimatedReanimated.View>
          <AnimatedReanimated.View style={imageIconStyle}>
            <ImageIcon color={colors.success} size={24} />
          </AnimatedReanimated.View>
        </View>
      </AnimatedReanimated.View>

      <View style={[styles.topHeaderWrapper, { paddingTop: insets.top }]}>
        {thumbnailUrl && (
          <Image
            source={{ uri: thumbnailUrl }}
            style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.25 : 0.35 }]}
            blurRadius={80}
            pointerEvents="none"
            contentFit="cover"
          />
        )}

        <DownloaderHeader
          colors={colors}
          onBack={() => navigation.goBack()}
          onNavigateDownloads={() => navigation.navigate('Tabs', { screen: 'Downloads' })}
          onRefresh={refetch}
          isLoading={detailsQuery.isLoading}
          isError={detailsQuery.isError}
          headerAnimatedStyle={headerAnimatedStyle}
        />

        {video && (
          <VideoContextCard
            colors={colors}
            thumbnailUrl={thumbnailUrl!}
            title={video.title}
            channelTitle={video.channelTitle}
          />
        )}

        {!detailsQuery.isLoading && !detailsQuery.isError && (
          <FormatFilterBar
            colors={colors}
            activeTab={activeTab}
            onSelect={setActiveTab}
            counts={counts}
          />
        )}
      </View>

      {detailsQuery.isLoading ? (
        <DownloaderSkeleton />
      ) : detailsQuery.isError ? (
        <DownloaderErrorState
          colors={colors}
          error={detailsQuery.error}
          onRetry={refetch}
        />
      ) : (
        <View style={styles.contentWrapper}>
          <FlashList
            data={activeFormats}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            // @ts-ignore
            estimatedItemSize={85}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            getItemType={() => 'format'}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem as any}
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText muted>No {activeTab} formats available.</AppText>
              </View>
            }
          />

          <View style={styles.footerInfo}>
            <AppText muted variant="caption" style={styles.footerInfoText}>
              Download links can expire after a short time.
            </AppText>
          </View>
        </View>
      )}
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  topHeaderWrapper: {
    overflow: 'hidden',
    paddingBottom: spacing.lg,
  },
  contentWrapper: {
    flex: 1,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerInfo: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerInfoText: {
    fontSize: typography.tiny,
    textAlign: 'center',
  },
  formatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
