package com.margelo.nitro.genyt.extractor

import android.util.Log
import com.genyt.extractor.bridge.NitroDtoMapper
import com.genyt.extractor.engine.ExtractorEngine
import com.genyt.extractor.engine.NewPipeExtractorEngine
import com.genyt.extractor.session.CancellationRegistry
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class HybridYoutubeExtractor(
    private val engine: ExtractorEngine = NewPipeExtractorEngine(),
    private val cancellations: CancellationRegistry = CancellationRegistry(),
) : HybridYoutubeExtractorSpec() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun healthCheck(): String = "ok"

    override fun search(
        requestId: String,
        query: String,
        limit: Double,
    ): Promise<NativePaginatedVideoResult> = request("search", requestId) { cancelled ->
        val result = engine.search(query, limit.toInt(), cancelled)
        NitroDtoMapper.mapPaginatedResult(result)
    }

    override fun getHomeFeed(
        requestId: String,
        topic: String?,
        limit: Double,
    ): Promise<NativePaginatedVideoResult> = request("getHomeFeed", requestId) { cancelled ->
        val result = engine.getHomeFeed(topic, limit.toInt(), cancelled)
        NitroDtoMapper.mapPaginatedResult(result)
    }

    override fun fetchNextPage(
        requestId: String,
        token: String
    ): Promise<NativePaginatedVideoResult> = request("fetchNextPage", requestId) { cancelled ->
        NitroDtoMapper.mapPaginatedResult(engine.fetchNextPage(token, cancelled))
    }


    override fun extractVideo(
        requestId: String,
        videoIdOrUrl: String,
    ): Promise<NativeExtractionResult> = request("extractVideo", requestId) { cancelled ->
        NitroDtoMapper.mapExtractionResult(engine.extractVideo(videoIdOrUrl, cancelled))
    }

    override fun resolveFormat(
        requestId: String,
        sessionId: String,
        formatId: String,
    ): Promise<NativeResolvedFormat> = request("resolveFormat", requestId) { cancelled ->
        NitroDtoMapper.mapResolvedFormat(engine.resolveFormat(sessionId, formatId, cancelled))
    }

    override fun getChannelDetails(
        requestId: String,
        channelIdOrUrl: String,
        tabFilter: String?
    ): Promise<com.margelo.nitro.genyt.extractor.NativeChannelDetails> = request("getChannelDetails", requestId) { cancelled ->
        NitroDtoMapper.mapChannelDetails(engine.getChannelDetails(channelIdOrUrl, tabFilter, cancelled))
    }

    override fun getPlaylistDetails(
        requestId: String,
        playlistIdOrUrl: String
    ): Promise<com.margelo.nitro.genyt.extractor.NativePlaylistDetails> = request("getPlaylistDetails", requestId) { cancelled ->
        NitroDtoMapper.mapPlaylistDetails(engine.getPlaylistDetails(playlistIdOrUrl, cancelled))
    }

    override fun cancel(requestId: String) {
        cancellations.cancel(requestId)
    }

    private fun <T> request(
        operation: String,
        requestId: String,
        block: (java.util.concurrent.atomic.AtomicBoolean) -> T,
    ): Promise<T> {
        val cancelled = cancellations.begin(requestId)
        return Promise.async(scope) {
            try {
                block(cancelled)
            } catch (error: Throwable) {
                throw error
            } finally {
                cancellations.finish(requestId)
            }
        }
    }

    private companion object {
        private const val TAG = "HybridYoutubeExtractor"
    }
}
