package com.genyt.extractor.model

data class VideoSummaryDto(
    val id: String,
    val title: String,
    val author: String,
    val thumbnailUrl: String,
    val authorAvatarUrl: String?,
    val channelId: String?,
    val durationSeconds: Double?,
    val viewCount: Double?,
    val publishedText: String?,
    val isShort: Boolean = false,
    val isPlaylist: Boolean = false,
)

data class MediaFormatDto(
    val formatId: String,
    val category: String,
    val label: String,
    val container: String,
    val quality: String,
    val bitrate: Double?,
    val contentLength: Double?,
    val hasAudio: Boolean,
    val hasVideo: Boolean,
)

data class ExtractionResult(
    val sessionId: String,
    val video: VideoSummaryDto,
    val description: String,
    val formats: List<MediaFormatDto>,
    val related: List<VideoSummaryDto>,
)

data class ResolvedFormat(
    val sessionId: String,
    val formatId: String,
    val url: String,
    val mimeType: String,
    val contentLength: Double?,
    val expiresAtEpochMs: Double,
)

data class SessionFormat(
    val formatId: String,
    val url: String,
    val mimeType: String,
    val contentLength: Double?,
)

data class PaginatedVideoResultDto(
    val videos: List<VideoSummaryDto>,
    val continuationToken: String?
)

data class ChannelDetailsDto(
    val id: String,
    val title: String,
    val avatarUrl: String?,
    val subscriberCountText: String?,
    val videoCountText: String?,
    val videos: List<VideoSummaryDto>,
    val continuationToken: String?
)

data class PlaylistDetailsDto(
    val id: String,
    val title: String,
    val channelTitle: String?,
    val thumbnailUrl: String?,
    val videoCountText: String?,
    val videos: List<VideoSummaryDto>,
    val continuationToken: String?
)
