package com.genyt.extractor.engine

import com.genyt.extractor.model.ExtractionResult
import com.genyt.extractor.model.ResolvedFormat
import com.genyt.extractor.model.VideoSummaryDto
import com.genyt.extractor.model.ChannelDetailsDto
import com.genyt.extractor.model.PlaylistDetailsDto
import java.util.concurrent.atomic.AtomicBoolean

import com.genyt.extractor.model.PaginatedVideoResultDto


interface ExtractorEngine {
    fun search(query: String, limit: Int, cancelled: AtomicBoolean): PaginatedVideoResultDto
    fun getHomeFeed(topic: String?, limit: Int, cancelled: AtomicBoolean): PaginatedVideoResultDto
    fun fetchNextPage(token: String, cancelled: AtomicBoolean): PaginatedVideoResultDto

    fun extractVideo(videoIdOrUrl: String, cancelled: AtomicBoolean): ExtractionResult
    fun resolveFormat(sessionId: String, formatId: String, cancelled: AtomicBoolean): ResolvedFormat

    fun getChannelDetails(channelIdOrUrl: String, tabFilter: String?, cancelled: AtomicBoolean): ChannelDetailsDto
    fun getPlaylistDetails(playlistIdOrUrl: String, cancelled: AtomicBoolean): PlaylistDetailsDto
}
