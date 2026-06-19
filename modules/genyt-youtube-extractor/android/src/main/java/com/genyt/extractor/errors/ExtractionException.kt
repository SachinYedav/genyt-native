package com.genyt.extractor.errors

enum class ExtractionErrorCode {
    NETWORK,
    INVALID_URL,
    VIDEO_UNAVAILABLE,
    LOGIN_REQUIRED,
    EXTRACTOR_OUTDATED,
    UNKNOWN,
}

class ExtractionException(
    val code: ExtractionErrorCode,
    message: String,
    cause: Throwable? = null,
) : RuntimeException("GENYT_${code.name}:$message", cause)
