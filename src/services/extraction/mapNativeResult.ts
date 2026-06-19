import type { MediaFormat, VideoDetails, VideoSummary } from '@/entities/video/types';

import { ExtractionError } from './extractionErrors';
import type {
  NativeExtractionResultDto,
  NativeMediaFormatDto,
  NativeVideoSummaryDto,
} from './types';

const extensions: MediaFormat['extension'][] = ['mp4', 'webm', 'm4a', 'mp3', 'jpg', 'png', 'webp'];
const categories: MediaFormat['category'][] = ['video', 'audio', 'thumbnail'];

export function mapNativeVideoSummary(value: NativeVideoSummaryDto): VideoSummary {
  assertString(value.id, 'video.id');
  assertString(value.title, 'video.title');
  assertString(value.author, 'video.author');
  assertString(value.thumbnailUrl, 'video.thumbnailUrl');



  return {
    id: value.id,
    title: value.title,
    channelTitle: value.author,
    channelId: value.channelId,
    channelAvatarUrl: value.authorAvatarUrl,
    thumbnailUrl: value.thumbnailUrl,
    durationLabel: formatDuration(value.durationSeconds),
    viewCountLabel: value.isPlaylist ? '' : formatViewCount(value.viewCount),
    videoCountLabel: value.isPlaylist && value.viewCount ? `${value.viewCount} videos` : undefined,
    publishedLabel: value.publishedText ?? '',
    isShort: value.isShort ?? false,
    isPlaylist: value.isPlaylist ?? false,
    source: 'youtube',
  };
}

export function mapNativeExtractionResult(value: NativeExtractionResultDto): VideoDetails {
  assertString(value.sessionId, 'sessionId');
  assertString(value.description, 'description');
  assertArray(value.formats, 'formats');
  assertArray(value.related, 'related');

  return {
    ...mapNativeVideoSummary(value.video),
    description: value.description,
    formats: value.formats.map((format) => mapNativeFormat(value.sessionId, format)),
    related: value.related.map(mapNativeVideoSummary),
  };
}

function mapNativeFormat(sessionId: string, value: NativeMediaFormatDto): MediaFormat {
  assertString(value.formatId, 'format.formatId');
  assertString(value.label, 'format.label');
  assertString(value.quality, 'format.quality');
  const category = categories.find((candidate) => candidate === value.category);
  const extension = extensions.find((candidate) => candidate === value.container.toLowerCase());

  if (!category || !extension) {
    throw new ExtractionError('EXTRACTOR_OUTDATED', `Unsupported format ${value.category}/${value.container}`);
  }

  return {
    id: value.formatId,
    extractionSessionId: sessionId,
    category,
    label: value.label,
    extension,
    qualityLabel: value.quality,
    sizeLabel: formatBytes(value.contentLength),
    downloadUrl: '', // To be resolved via extractor later
    hasAudio: value.hasAudio,
    hasVideo: value.hasVideo,
  };
}

function formatDuration(seconds?: number): string {
  if (!Number.isFinite(seconds)) return '';
  const total = Math.max(0, Math.floor(seconds ?? 0));
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  return parts
    .slice(parts[0] > 0 ? 0 : 1)
    .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
    .join(':');
}

function formatViewCount(value?: number): string {
  if (!Number.isFinite(value)) return '';
  return `${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value ?? 0)} views`;
}

function formatBytes(value?: number): string | undefined {
  if (!Number.isFinite(value) || !value) return undefined;
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string') throw new ExtractionError('EXTRACTOR_OUTDATED', `Invalid ${field}`);
}

function assertArray(value: unknown, field: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new ExtractionError('EXTRACTOR_OUTDATED', `Invalid ${field}`);
}
