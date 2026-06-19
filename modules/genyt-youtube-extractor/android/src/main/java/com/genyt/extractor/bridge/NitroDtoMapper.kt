package com.genyt.extractor.bridge

import com.genyt.extractor.model.ExtractionResult
import com.genyt.extractor.model.MediaFormatDto
import com.genyt.extractor.model.ResolvedFormat
import com.genyt.extractor.model.VideoSummaryDto
import com.genyt.extractor.model.PaginatedVideoResultDto
import com.margelo.nitro.genyt.extractor.NativeExtractionResult
import com.margelo.nitro.genyt.extractor.NativeMediaFormat
import com.margelo.nitro.genyt.extractor.NativeResolvedFormat
import com.margelo.nitro.genyt.extractor.NativeVideoSummary
import com.margelo.nitro.genyt.extractor.NativePaginatedVideoResult

import com.genyt.extractor.model.*
object NitroDtoMapper {
    fun mapVideoSummary(value: VideoSummaryDto): NativeVideoSummary = NativeVideoSummary(
        value.id,
        value.title,
        value.author,
        value.thumbnailUrl,
        value.authorAvatarUrl,
        value.channelId,
        value.durationSeconds,
        value.viewCount,
        value.publishedText,
        value.isShort,
        value.isPlaylist,
    )

    fun mapVideoSummaries(dtos: List<VideoSummaryDto>): Array<NativeVideoSummary> {
        return dtos.map { mapVideoSummary(it) }.toTypedArray()
    }

    fun mapPaginatedResult(dto: PaginatedVideoResultDto): NativePaginatedVideoResult {
        return NativePaginatedVideoResult(
            mapVideoSummaries(dto.videos),
            dto.continuationToken
        )
    }



    fun mapMediaFormat(value: MediaFormatDto): NativeMediaFormat = NativeMediaFormat(
        value.formatId,
        value.category,
        value.label,
        value.container,
        value.quality,
        value.bitrate,
        value.contentLength,
        value.hasAudio,
        value.hasVideo,
    )

    fun mapExtractionResult(value: ExtractionResult): NativeExtractionResult = NativeExtractionResult(
        value.sessionId,
        mapVideoSummary(value.video),
        value.description,
        value.formats.map(::mapMediaFormat).toTypedArray(),
        mapVideoSummaries(value.related),
    )

    fun mapResolvedFormat(value: ResolvedFormat): NativeResolvedFormat = NativeResolvedFormat(
        value.sessionId,
        value.formatId,
        value.url,
        value.mimeType,
        value.contentLength,
        value.expiresAtEpochMs,
    )

    fun mapChannelDetails(value: ChannelDetailsDto): com.margelo.nitro.genyt.extractor.NativeChannelDetails {
        return com.margelo.nitro.genyt.extractor.NativeChannelDetails(
            value.id,
            value.title,
            value.avatarUrl,
            value.subscriberCountText,
            value.videoCountText,
            mapVideoSummaries(value.videos),
            value.continuationToken
        )
    }

    fun mapPlaylistDetails(value: PlaylistDetailsDto): com.margelo.nitro.genyt.extractor.NativePlaylistDetails {
        return com.margelo.nitro.genyt.extractor.NativePlaylistDetails(
            value.id,
            value.title,
            value.channelTitle,
            value.thumbnailUrl,
            value.videoCountText,
            mapVideoSummaries(value.videos),
            value.continuationToken
        )
    }
}
