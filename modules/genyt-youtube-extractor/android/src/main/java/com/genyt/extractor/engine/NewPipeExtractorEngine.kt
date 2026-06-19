package com.genyt.extractor.engine

import android.util.Log
import com.genyt.extractor.errors.ExtractionErrorCode
import com.genyt.extractor.errors.ExtractionException
import com.genyt.extractor.model.ExtractionResult
import com.genyt.extractor.model.MediaFormatDto
import com.genyt.extractor.model.PaginatedVideoResultDto
import com.genyt.extractor.model.ResolvedFormat
import com.genyt.extractor.model.SessionFormat
import com.genyt.extractor.model.VideoSummaryDto
import com.genyt.extractor.network.NewPipeDownloader
import com.genyt.extractor.session.ExtractionSessionStore
import org.schabi.newpipe.extractor.InfoItem
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.localization.Localization
import org.schabi.newpipe.extractor.services.youtube.YoutubeService
import org.schabi.newpipe.extractor.stream.StreamInfo
import org.schabi.newpipe.extractor.stream.StreamInfoItem
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Hot-swappable extraction engine powered by NewPipe Extractor.
 *
 * Implements the same [ExtractorEngine] interface as [YouTubeExtractorEngine],
 * allowing a 1-line swap in [HybridYoutubeExtractor]. All old files remain
 * untouched on disk as a safe fallback.
 *
 * Key differences from the custom engine:
 * - No custom InnerTube API calls → uses NewPipe's page scraping
 * - No NParamDecipherer / QuickJS → NewPipe handles signature deciphering via Rhino
 * - No IOS/ANDROID client spoofing → NewPipe manages client identity internally
 */
class NewPipeExtractorEngine(
    private val sessions: ExtractionSessionStore = ExtractionSessionStore(),
) : ExtractorEngine {

    init {
        // Thread-safe: NewPipe.init is idempotent after first call
        try {
            NewPipe.init(
                NewPipeDownloader.getInstance(),
                Localization("en", "US"),
            )
            Log.d(TAG, "NewPipe initialized successfully")
        } catch (e: Exception) {
            Log.w(TAG, "NewPipe.init called again (already initialized)", e)
        }
    }

    private val youtubeService: YoutubeService
        get() = ServiceList.YouTube as YoutubeService

    // ── Search ──────────────────────────────────────────

    override fun search(query: String, limit: Int, cancelled: AtomicBoolean): PaginatedVideoResultDto {
        if (query.isBlank()) return PaginatedVideoResultDto(emptyList(), null)
        checkCancelled(cancelled)

        return try {
            Log.d(TAG, "search query=\"$query\" limit=$limit")
            val extractor = youtubeService.getSearchExtractor(query)
            extractor.fetchPage()
            checkCancelled(cancelled)

            val result = extractor.initialPage
            val videos = NewPipeDataMapper.mapInfoItems(result.items, limit)
            val nextToken = NewPipeDataMapper.serializePage(result.nextPage, "SEARCH", query)

            Log.d(TAG, "search result count=${videos.size} hasNext=${nextToken != null}")
            PaginatedVideoResultDto(videos, nextToken)
        } catch (e: ExtractionException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "search failed", e)
            throw mapException(e)
        }
    }

    // ── Home Feed (via Search, per Q1 decision) ──────

    override fun getHomeFeed(topic: String?, limit: Int, cancelled: AtomicBoolean): PaginatedVideoResultDto {
        val query = topic?.takeUnless { it.equals("All", ignoreCase = true) }.orEmpty()
            .ifBlank { "trending" }
        Log.d(TAG, "getHomeFeed topic=\"$topic\" mappedQuery=\"$query\" limit=$limit")
        return search(query, limit, cancelled)
    }

    // ── Pagination ──────────────────────────────────────

    override fun fetchNextPage(token: String, cancelled: AtomicBoolean): PaginatedVideoResultDto {
        checkCancelled(cancelled)

        return try {
            Log.d(TAG, "fetchNextPage token=${token.take(60)}...")
            val tokenData = NewPipeDataMapper.deserializePage(token)
            if (tokenData == null) throw ExtractionException(ExtractionErrorCode.UNKNOWN, "Invalid pagination token")

            val extractor: org.schabi.newpipe.extractor.ListExtractor<*> = when (tokenData.type) {
                "PLAYLIST" -> youtubeService.getPlaylistExtractor(tokenData.context)
                "CHANNEL" -> {
                    val channelUrl = if (tokenData.context.startsWith("http")) tokenData.context else "https://www.youtube.com/channel/${tokenData.context}"
                    val info = org.schabi.newpipe.extractor.channel.ChannelInfo.getInfo(youtubeService, channelUrl)
                    val targetTab = if (!tokenData.filter.isNullOrBlank()) {
                        info.tabs?.find { it.url.contains("/${tokenData.filter}", ignoreCase = true) } ?: info.tabs?.firstOrNull()
                    } else {
                        info.tabs?.firstOrNull()
                    }
                    if (targetTab == null) throw ExtractionException(ExtractionErrorCode.UNKNOWN, "Could not resolve channel tab")
                    youtubeService.getChannelTabExtractor(targetTab)
                }
                else -> youtubeService.getSearchExtractor(tokenData.context.takeIf { it.isNotBlank() } ?: " ")
            } as org.schabi.newpipe.extractor.ListExtractor<*>
            checkCancelled(cancelled)

            val nextPage = extractor.getPage(tokenData.page) as org.schabi.newpipe.extractor.ListExtractor.InfoItemsPage<*>
            val videos = NewPipeDataMapper.mapInfoItems(nextPage.items, 50)
            val nextToken = NewPipeDataMapper.serializePage(nextPage.nextPage, tokenData.type, tokenData.context, tokenData.filter)

            Log.d(TAG, "fetchNextPage result count=${videos.size} hasNext=${nextToken != null}")
            PaginatedVideoResultDto(videos, nextToken)
        } catch (e: ExtractionException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "fetchNextPage failed", e)
            throw mapException(e)
        }
    }

    // ── Video Extraction ────────────────────────────────

    override fun extractVideo(videoIdOrUrl: String, cancelled: AtomicBoolean): ExtractionResult {
        checkCancelled(cancelled)

        return try {
            val videoUrl = normalizeVideoUrl(videoIdOrUrl)
            Log.d(TAG, "extractVideo url=$videoUrl")


            val info = try {
                StreamInfo.getInfo(youtubeService, videoUrl)
            } catch (e: Exception) {
                throw Exception("StreamInfo.getInfo failed: ${e.message}", e)
            }
            checkCancelled(cancelled)



            // Attempt to format absolute upload date to relative (e.g. "2 days ago")
            val relativeDate = try {
                val millis = info.uploadDate?.offsetDateTime()?.toInstant()?.toEpochMilli()
                if (millis != null) {
                    android.text.format.DateUtils.getRelativeTimeSpanString(
                        millis,
                        System.currentTimeMillis(),
                        android.text.format.DateUtils.MINUTE_IN_MILLIS
                    ).toString()
                } else null
            } catch (e: Exception) {
                null
            }

            // Map video metadata
            val video = VideoSummaryDto(
                id = extractVideoId(videoUrl),
                title = info.name ?: "",
                author = info.uploaderName ?: "",
                thumbnailUrl = NewPipeDataMapper.bestThumbnail(info.thumbnails),
                authorAvatarUrl = NewPipeDataMapper.bestThumbnail(info.uploaderAvatars),
                channelId = info.uploaderUrl?.let { extractChannelId(it) },
                durationSeconds = info.duration.takeIf { it > 0 }?.toDouble(),
                viewCount = info.viewCount.takeIf { it >= 0 }?.toDouble(),
                publishedText = relativeDate ?: info.textualUploadDate,
            )

            // Map all streams → formats + session formats
            val formats = mutableListOf<MediaFormatDto>()
            val sessionFormats = mutableListOf<SessionFormat>()

            // Progressive streams (video + audio muxed)
            info.videoStreams
                ?.filter { !it.isVideoOnly && it.content != null }
                ?.forEach { stream ->
                    val (dto, sf) = NewPipeDataMapper.mapVideoStream(stream)
                    formats += dto
                    sessionFormats += sf
                }

            // Video-only (adaptive DASH)
            info.videoOnlyStreams
                ?.filter { it.content != null }
                ?.forEach { stream ->
                    val (dto, sf) = NewPipeDataMapper.mapVideoStream(stream)
                    formats += dto
                    sessionFormats += sf
                }

            // Audio-only
            info.audioStreams
                ?.filter { it.content != null }
                ?.forEach { stream ->
                    val (dto, sf) = NewPipeDataMapper.mapAudioStream(stream)
                    formats += dto
                    sessionFormats += sf
                }

            // Thumbnail
            val thumbnailUrl = NewPipeDataMapper.bestThumbnail(info.thumbnails)
            if (thumbnailUrl.isNotBlank()) {
                val (thumbDto, thumbSf) = NewPipeDataMapper.mapThumbnail(thumbnailUrl)
                formats += thumbDto
                sessionFormats += thumbSf
            }

            if (formats.none { it.category != "thumbnail" }) {
                throw ExtractionException(
                    ExtractionErrorCode.EXTRACTOR_OUTDATED,
                    "No media formats extracted by NewPipe",
                )
            }

            checkCancelled(cancelled)

            // Create session and fetch related
            val sessionId = sessions.create(sessionFormats)

            // Clean description HTML tags to plain text
            val rawDescription = info.description?.content ?: ""
            val description = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                android.text.Html.fromHtml(rawDescription, android.text.Html.FROM_HTML_MODE_LEGACY).toString()
            } else {
                @Suppress("DEPRECATION")
                android.text.Html.fromHtml(rawDescription).toString()
            }

            val related = try {
                info.relatedItems
                    ?.filterIsInstance<StreamInfoItem>()
                    ?.take(8)
                    ?.map(NewPipeDataMapper::mapStreamInfoItem)
                    ?.filterNot { it.id == video.id }
                    ?: emptyList()
            } catch (e: Exception) {
                Log.w(TAG, "Related items extraction failed, using empty", e)
                emptyList()
            }

            Log.d(TAG, "extractVideo success: ${formats.size} formats, ${related.size} related")
            ExtractionResult(sessionId, video, description, formats, related)
        } catch (e: ExtractionException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "extractVideo failed", e)
            throw mapException(e)
        }
    }

    // ── Format Resolution ───────────────────────────────

    override fun resolveFormat(
        sessionId: String,
        formatId: String,
        cancelled: AtomicBoolean,
    ): ResolvedFormat {
        checkCancelled(cancelled)
        val (format, expiresAt) = sessions.resolve(sessionId, formatId)
        return ResolvedFormat(
            sessionId,
            formatId,
            format.url,
            format.mimeType,
            format.contentLength,
            expiresAt.toDouble(),
        )
    }

    // ── Channel & Playlist ──────────────────────────────

    override fun getChannelDetails(channelIdOrUrl: String, tabFilter: String?, cancelled: AtomicBoolean): com.genyt.extractor.model.ChannelDetailsDto {
        checkCancelled(cancelled)
        return try {
            Log.d(TAG, "getChannelDetails id=$channelIdOrUrl filter=$tabFilter")

            // Ensure we have a valid URL for NewPipe
            val channelUrl = if (channelIdOrUrl.startsWith("http")) channelIdOrUrl else "https://www.youtube.com/channel/$channelIdOrUrl"

            // 1. Fetch channel metadata.
            val info = org.schabi.newpipe.extractor.channel.ChannelInfo.getInfo(youtubeService, channelUrl)
            checkCancelled(cancelled)

            // NewPipe 0.22+ handles channel streams via Tabs (ListLinkHandler)
            val tabs = info.getTabs()
            
            // Match tab by keyword to avoid strict URL mismatches (e.g., @username vs channel/UC...)
            val targetTab = if (!tabFilter.isNullOrBlank()) {
                tabs?.find { it.url.contains("/$tabFilter", ignoreCase = true) } ?: tabs?.firstOrNull()
            } else {
                tabs?.firstOrNull()
            }

            var items: List<org.schabi.newpipe.extractor.InfoItem> = emptyList()
            var nextPage: org.schabi.newpipe.extractor.Page? = null

            if (targetTab != null) {
                val tabExtractor = youtubeService.getChannelTabExtractor(targetTab)
                tabExtractor.fetchPage()
                val page = tabExtractor.getInitialPage()
                
                items = page.getItems()
                nextPage = page.getNextPage()
            }

            val videos = NewPipeDataMapper.mapInfoItems(items, 50)
            val nextToken = NewPipeDataMapper.serializePage(nextPage, "CHANNEL", channelIdOrUrl, tabFilter)

            com.genyt.extractor.model.ChannelDetailsDto(
                id = info.url ?: channelIdOrUrl,
                title = info.name ?: "",
                avatarUrl = NewPipeDataMapper.bestThumbnail(info.avatars),
                subscriberCountText = info.subscriberCount?.toString(),
                videoCountText = null,
                videos = videos,
                continuationToken = nextToken
            )
        } catch (e: Exception) {
            Log.e(TAG, "Extraction failed natively: ${e.message}")
            throw Exception("Extraction failed: ${e.message}")
        }
    }

    override fun getPlaylistDetails(playlistIdOrUrl: String, cancelled: AtomicBoolean): com.genyt.extractor.model.PlaylistDetailsDto {
        checkCancelled(cancelled)
        return try {
            Log.d(TAG, "getPlaylistDetails url=$playlistIdOrUrl")
            val info = org.schabi.newpipe.extractor.playlist.PlaylistInfo.getInfo(youtubeService, playlistIdOrUrl)
            checkCancelled(cancelled)

            // Playlist streams are directly in getRelatedItems() as a List
            val items: List<org.schabi.newpipe.extractor.InfoItem> = info.getRelatedItems() ?: emptyList()
            val nextPage = info.getNextPage()
            val videos = NewPipeDataMapper.mapInfoItems(items, 100)
            val nextToken = NewPipeDataMapper.serializePage(nextPage, "PLAYLIST", playlistIdOrUrl)

            com.genyt.extractor.model.PlaylistDetailsDto(
                id = info.url ?: playlistIdOrUrl,
                title = info.name ?: "",
                channelTitle = info.uploaderName,
                thumbnailUrl = NewPipeDataMapper.bestThumbnail(info.thumbnails),
                videoCountText = info.streamCount?.toString(),
                videos = videos,
                continuationToken = nextToken
            )
        } catch (e: Exception) {
            Log.e(TAG, "Extraction failed natively: ${e.message}")
            throw Exception("Extraction failed: ${e.message}")
        }
    }

    // ── Helpers ──────────────────────────────────────────

    /**
     * ALWAYS canonicalizes the input to a standard /watch?v= URL.
     * This prevents /shorts/ URLs from triggering NewPipe's Reel extractor,
     * which returns truncated streaming data.
     */
    private fun normalizeVideoUrl(input: String): String {
        val trimmed = input.trim()

        // If it's a bare 11-char video ID, wrap it directly
        if (Regex("^[A-Za-z0-9_-]{11}$").matches(trimmed)) {
            return "https://www.youtube.com/watch?v=$trimmed"
        }

        // If it's any kind of YouTube URL, extract the ID and rebuild as /watch?v=
        if (trimmed.startsWith("http")) {
            val id = extractVideoId(trimmed)
            if (id.isNotBlank() && id.length == 11) {
                return "https://www.youtube.com/watch?v=$id"
            }
        }

        // Last resort: treat the whole input as an ID
        return "https://www.youtube.com/watch?v=$trimmed"
    }

    private fun extractVideoId(url: String): String {
        val patterns = listOf(
            Regex("[?&]v=([A-Za-z0-9_-]{11})"),
            Regex("youtu\\.be/([A-Za-z0-9_-]{11})"),
            Regex("/shorts/([A-Za-z0-9_-]{11})"),
            Regex("/embed/([A-Za-z0-9_-]{11})"),
        )
        for (pattern in patterns) {
            pattern.find(url)?.groupValues?.getOrNull(1)?.let { return it }
        }
        return url.substringAfterLast("/").take(11)
    }

    private fun extractChannelId(uploaderUrl: String): String? {
        val match = Regex("/channel/([A-Za-z0-9_-]+)").find(uploaderUrl)
        return match?.groupValues?.getOrNull(1)
    }

    private fun checkCancelled(cancelled: AtomicBoolean) {
        if (cancelled.get()) {
            throw ExtractionException(ExtractionErrorCode.UNKNOWN, "Request cancelled")
        }
    }

    private fun mapException(e: Exception): ExtractionException {
        val message = e.message ?: "Unknown error"
        return when {
            e is org.schabi.newpipe.extractor.exceptions.ContentNotAvailableException ->
                ExtractionException(ExtractionErrorCode.VIDEO_UNAVAILABLE, message, e)
            e is org.schabi.newpipe.extractor.exceptions.AgeRestrictedContentException ->
                ExtractionException(ExtractionErrorCode.LOGIN_REQUIRED, message, e)
            e is org.schabi.newpipe.extractor.exceptions.ContentNotSupportedException ->
                ExtractionException(ExtractionErrorCode.VIDEO_UNAVAILABLE, message, e)
            e is org.schabi.newpipe.extractor.exceptions.ExtractionException ->
                ExtractionException(ExtractionErrorCode.EXTRACTOR_OUTDATED, message, e)
            e is java.io.IOException ->
                ExtractionException(ExtractionErrorCode.NETWORK, message, e)
            else ->
                ExtractionException(ExtractionErrorCode.UNKNOWN, message, e)
        }
    }

    companion object {
        private const val TAG = "NewPipeExtractorEngine"
    }
}
