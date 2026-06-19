package com.genyt.extractor.engine

import com.genyt.extractor.model.MediaFormatDto
import com.genyt.extractor.model.PaginatedVideoResultDto
import com.genyt.extractor.model.SessionFormat
import com.genyt.extractor.model.VideoSummaryDto
import org.schabi.newpipe.extractor.Image
import org.schabi.newpipe.extractor.InfoItem
import org.schabi.newpipe.extractor.stream.AudioStream
import org.schabi.newpipe.extractor.stream.StreamInfo
import org.schabi.newpipe.extractor.stream.StreamInfoItem
import org.schabi.newpipe.extractor.stream.VideoStream

/**
 * Maps NewPipe Java domain objects to our internal Kotlin DTOs.
 * Guarantees zero JS/UI breakage — the Nitro bridge types remain untouched.
 */
internal object NewPipeDataMapper {

    // ── VideoSummaryDto ─────────────────────────────────────

    fun mapStreamInfoItem(item: StreamInfoItem): VideoSummaryDto {
        // 1. Primary: Native NewPipe isShortFormContent() flag
        // 2. Fallback: URL pattern matching for /shorts/
        val isShort = item.isShortFormContent() || item.url.contains("/shorts/", ignoreCase = true)

        return VideoSummaryDto(
            id = extractVideoId(item.url),
            title = item.name ?: "",
            author = item.uploaderName ?: "",
            thumbnailUrl = bestThumbnail(item.thumbnails),
            authorAvatarUrl = bestThumbnail(item.uploaderAvatars),
            channelId = item.uploaderUrl?.let { extractChannelId(it) },
            durationSeconds = item.duration.takeIf { it > 0 }?.toDouble(),
            viewCount = item.viewCount.takeIf { it >= 0 }?.toDouble(),
            publishedText = item.textualUploadDate,
            isShort = isShort,
        )
    }

    fun mapPlaylistInfoItem(item: org.schabi.newpipe.extractor.playlist.PlaylistInfoItem): VideoSummaryDto {
        return VideoSummaryDto(
            id = extractPlaylistId(item.url),
            title = item.name ?: "",
            author = item.uploaderName ?: "",
            thumbnailUrl = bestThumbnail(item.thumbnails),
            authorAvatarUrl = null,
            channelId = item.uploaderUrl?.let { extractChannelId(it) },
            durationSeconds = null,
            viewCount = item.streamCount.takeIf { it >= 0 }?.toDouble(),
            publishedText = null,
            isShort = false,
            isPlaylist = true,
        )
    }

    fun mapInfoItems(items: List<InfoItem>, limit: Int): List<VideoSummaryDto> {
        return items
            .take(limit)
            .mapNotNull { item ->
                when (item) {
                    is StreamInfoItem -> mapStreamInfoItem(item)
                    is org.schabi.newpipe.extractor.playlist.PlaylistInfoItem -> mapPlaylistInfoItem(item)
                    else -> null
                }
            }
    }

    // ── MediaFormatDto & SessionFormat ────────────────────

    fun mapVideoStream(stream: VideoStream): Pair<MediaFormatDto, SessionFormat> {
        val formatId = stream.itag.toString().takeIf { it != "-1" }
            ?: "v-${stream.resolution ?: "unknown"}"
        val container = stream.format?.suffix ?: "mp4"
        val quality = stream.resolution ?: "unknown"
        val isVideoOnly = stream.isVideoOnly
        val contentLength = stream.itagItem?.contentLength?.takeIf { it > 0 }?.toDouble()
        val streamUrl = stream.url ?: stream.content ?: ""

        val dto = MediaFormatDto(
            formatId = formatId,
            category = "video",
            label = "Video $quality",
            container = container,
            quality = quality,
            bitrate = stream.bitrate.takeIf { it > 0 }?.toDouble(),
            contentLength = contentLength,
            hasAudio = !isVideoOnly,
            hasVideo = true,
        )
        val session = SessionFormat(
            formatId = formatId,
            url = streamUrl,
            mimeType = stream.format?.mimeType ?: "video/$container",
            contentLength = contentLength,
        )
        return dto to session
    }

    fun mapAudioStream(stream: AudioStream): Pair<MediaFormatDto, SessionFormat> {
        val formatId = stream.itag.toString().takeIf { it != "-1" }
            ?: "a-${stream.averageBitrate}kbps"
        val container = stream.format?.suffix ?: "m4a"
        val bitrate = stream.averageBitrate.takeIf { it > 0 }
        val quality = if (bitrate != null) "${bitrate} kbps" else "unknown"
        val contentLength = stream.itagItem?.contentLength?.takeIf { it > 0 }?.toDouble()
        val streamUrl = stream.url ?: stream.content ?: ""

        val dto = MediaFormatDto(
            formatId = formatId,
            category = "audio",
            label = "Audio $quality",
            container = container,
            quality = quality,
            bitrate = bitrate?.toDouble(),
            contentLength = contentLength,
            hasAudio = true,
            hasVideo = false,
        )
        val session = SessionFormat(
            formatId = formatId,
            url = streamUrl,
            mimeType = stream.format?.mimeType ?: "audio/$container",
            contentLength = contentLength,
        )
        return dto to session
    }

    fun extractMediaFormats(info: StreamInfo): Pair<List<MediaFormatDto>, List<SessionFormat>> {
        val formats = mutableListOf<MediaFormatDto>()
        val sessionFormats = mutableListOf<SessionFormat>()

        // 1. Progressive streams (video + audio muxed)
        info.videoStreams?.forEach { stream ->
            if (!stream.isVideoOnly && !stream.url.isNullOrBlank()) {
                val (dto, sf) = mapVideoStream(stream)
                formats += dto.copy(hasVideo = true, hasAudio = true)
                sessionFormats += sf
            }
        }

        // 2. Video-only (adaptive DASH)
        info.videoOnlyStreams?.forEach { stream ->
            if (!stream.url.isNullOrBlank()) {
                val (dto, sf) = mapVideoStream(stream)
                formats += dto.copy(hasVideo = true, hasAudio = false)
                sessionFormats += sf
            }
        }

        // 3. Audio-only (adaptive DASH)
        info.audioStreams?.forEach { stream ->
            if (!stream.url.isNullOrBlank()) {
                val (dto, sf) = mapAudioStream(stream)
                formats += dto.copy(hasVideo = false, hasAudio = true)
                sessionFormats += sf
            }
        }

        // 4. Thumbnail
        val thumbnailUrl = bestThumbnail(info.thumbnails)
        if (thumbnailUrl.isNotBlank()) {
            val (thumbDto, thumbSf) = mapThumbnail(thumbnailUrl)
            formats += thumbDto
            sessionFormats += thumbSf
        }

        return formats to sessionFormats
    }

    fun mapThumbnail(thumbnailUrl: String): Pair<MediaFormatDto, SessionFormat> {
        val dto = MediaFormatDto(
            formatId = "thumbnail-max",
            category = "thumbnail",
            label = "Thumbnail",
            container = "jpg",
            quality = "Max resolution",
            bitrate = null,
            contentLength = null,
            hasAudio = false,
            hasVideo = false,
        )
        val session = SessionFormat("thumbnail-max", thumbnailUrl, "image/jpeg", null)
        return dto to session
    }

    // ── Pagination ────────────────────────────────────────
    
    /**
     * Encodes NewPipe's Page object as a serialized continuation token string.
     * Preserves the url, id, body array, and the original search query.
     */
    fun serializePage(page: org.schabi.newpipe.extractor.Page?, type: String, context: String, filter: String? = null): String? {
        if (page == null) return null
        val json = org.json.JSONObject().apply {
            put("url", page.url)
            put("id", page.id)
            if (page.ids != null) {
                val idsArray = org.json.JSONArray()
                page.ids.forEach { idsArray.put(it) }
                put("ids", idsArray)
            }
            if (page.body != null) {
                put("body", android.util.Base64.encodeToString(page.body, android.util.Base64.NO_WRAP))
            }
            put("type", type)
            put("context", context)
            if (filter != null) {
                put("filter", filter)
            }
        }
        return android.util.Base64.encodeToString(json.toString().toByteArray(), android.util.Base64.NO_WRAP)
    }

    data class TokenData(
        val page: org.schabi.newpipe.extractor.Page,
        val type: String,
        val context: String,
        val filter: String?
    )

    fun deserializePage(token: String): TokenData? {
        if (token.isBlank()) return null
        return try {
            val decoded = String(android.util.Base64.decode(token, android.util.Base64.NO_WRAP))
            val json = org.json.JSONObject(decoded)
            val url = json.optString("url", "").takeIf { it.isNotBlank() }
            val id = json.optString("id", "").takeIf { it.isNotBlank() }
            
            val bodyStr = json.optString("body", "")
            val body = if (bodyStr.isNotBlank()) android.util.Base64.decode(bodyStr, android.util.Base64.NO_WRAP) else null
            
            val type = json.optString("type", "SEARCH")
            val context = json.optString("context", "")
            val filter = json.optString("filter", "").takeIf { it.isNotBlank() }
            
            val idsArray = json.optJSONArray("ids")
            val ids = if (idsArray != null) {
                val list = mutableListOf<String>()
                for (i in 0 until idsArray.length()) {
                    list.add(idsArray.getString(i))
                }
                list
            } else null
            
            TokenData(org.schabi.newpipe.extractor.Page(url ?: "", id, ids, emptyMap(), body), type, context, filter)
        } catch (e: Exception) {
            null
        }
    }

    // ── Helpers ─────────────────────────────────────────

    fun bestThumbnail(images: List<Image>?): String {
        if (images.isNullOrEmpty()) return ""
        // Prefer the largest resolution available
        return images.maxByOrNull { it.height }?.url
            ?: images.lastOrNull()?.url
            ?: ""
    }

    private fun extractVideoId(url: String): String {
        // Handle: https://www.youtube.com/watch?v=XXXXXXXXXXX
        //         https://youtu.be/XXXXXXXXXXX
        //         https://www.youtube.com/shorts/XXXXXXXXXXX
        val patterns = listOf(
            Regex("[?&]v=([A-Za-z0-9_-]{11})"),
            Regex("youtu\\.be/([A-Za-z0-9_-]{11})"),
            Regex("/shorts/([A-Za-z0-9_-]{11})"),
            Regex("/embed/([A-Za-z0-9_-]{11})"),
        )
        for (pattern in patterns) {
            pattern.find(url)?.groupValues?.getOrNull(1)?.let { return it }
        }
        // Fallback: return the URL itself trimmed
        return url.substringAfterLast("/").take(11)
    }

    private fun extractChannelId(uploaderUrl: String): String? {
        // https://www.youtube.com/channel/UCxxxxxxx
        val match = Regex("/channel/([A-Za-z0-9_-]+)").find(uploaderUrl)
        return match?.groupValues?.getOrNull(1)
    }

    private fun extractPlaylistId(url: String): String {
        val match = Regex("[?&]list=([A-Za-z0-9_-]+)").find(url)
        return match?.groupValues?.getOrNull(1) ?: url
    }
}
