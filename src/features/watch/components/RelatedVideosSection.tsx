import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, typography } from '@/shared/theme';
import { AppText } from '@/shared/ui/AppText';
import { VideoCard } from '@/shared/ui/VideoCard';
import { ShortsShelf } from '@/shared/ui/ShortsShelf';
import type { VideoDetails, VideoSummary } from '@/entities/video/types';

interface Props {
  video: VideoDetails;
  queue: VideoSummary[];
  currentIndex: number;
  onQueueVideoPress: (index: number) => void;
  onRelatedVideoPress: (video: VideoSummary) => void;
}

export function RelatedVideosSection({
  video,
  queue,
  currentIndex,
  onQueueVideoPress,
  onRelatedVideoPress,
}: Props) {
  const relatedShorts = video.related.filter((v) => v.isShort);
  const relatedVideos = video.related.filter((v) => !v.isShort);

  // Only show related if queue is small or we reached the end of the queue
  const showRelated = !(queue.length > 1 && queue.length - currentIndex > 5);

  return (
    <View style={styles.relatedContainer}>
      {queue.length > 1 ? (
        <>
          <AppText variant="subtitle" style={styles.relatedTitle}>
            Up Next
          </AppText>
          {queue.slice(currentIndex + 1).map((queuedVideo, index) => (
            <VideoCard
              key={`queue-${queuedVideo.id}-${index}`}
              video={queuedVideo}
              onPress={() => onQueueVideoPress(currentIndex + 1 + index)}
            />
          ))}
          {/* Render related videos after the queue just in case */}
          {queue.length - currentIndex <= 1 && showRelated && (
            <AppText variant="subtitle" style={[styles.relatedTitle, { marginTop: spacing.xl }]}>
              Related
            </AppText>
          )}
        </>
      ) : (
        <AppText variant="subtitle" style={styles.relatedTitle}>
          Related
        </AppText>
      )}

      {showRelated && (
        <>
          {relatedShorts.length > 0 && <ShortsShelf shorts={relatedShorts} disablePadding />}
          {relatedVideos.map((related, index) => (
            <VideoCard
              key={related.id ? `${related.id}-${index}` : index.toString()}
              video={related}
              onPress={(nextVideo) => onRelatedVideoPress(nextVideo)}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  relatedContainer: { paddingTop: spacing.sm },
  relatedTitle: {
    marginBottom: spacing.md,
    fontWeight: '700',
    paddingLeft: spacing.md,
  },
});
