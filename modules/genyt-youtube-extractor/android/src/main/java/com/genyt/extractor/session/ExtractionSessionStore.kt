package com.genyt.extractor.session

import com.genyt.extractor.errors.ExtractionErrorCode
import com.genyt.extractor.errors.ExtractionException
import com.genyt.extractor.model.SessionFormat
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class ExtractionSessionStore(
    private val ttlMs: Long = 10 * 60 * 1000L,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    private data class Session(
        val expiresAt: Long,
        val formats: Map<String, SessionFormat>,
    )

    private val sessions = ConcurrentHashMap<String, Session>()

    fun create(formats: List<SessionFormat>): String {
        removeExpired()
        val id = UUID.randomUUID().toString()
        sessions[id] = Session(clock() + ttlMs, formats.associateBy(SessionFormat::formatId))
        return id
    }

    fun resolve(sessionId: String, formatId: String): Pair<SessionFormat, Long> {
        val session = sessions[sessionId]
            ?: throw ExtractionException(ExtractionErrorCode.VIDEO_UNAVAILABLE, "Extraction session expired")
        if (session.expiresAt <= clock()) {
            sessions.remove(sessionId)
            throw ExtractionException(ExtractionErrorCode.VIDEO_UNAVAILABLE, "Extraction session expired")
        }
        val format = session.formats[formatId]
            ?: throw ExtractionException(ExtractionErrorCode.VIDEO_UNAVAILABLE, "Format is not in this session")
        return format to session.expiresAt
    }

    private fun removeExpired() {
        val now = clock()
        sessions.entries.removeIf { it.value.expiresAt <= now }
    }
}
