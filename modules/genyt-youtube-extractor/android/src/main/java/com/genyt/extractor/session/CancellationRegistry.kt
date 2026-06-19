package com.genyt.extractor.session

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

class CancellationRegistry {
    private val requests = ConcurrentHashMap<String, AtomicBoolean>()

    fun begin(requestId: String): AtomicBoolean =
        requests.compute(requestId) { _, existing -> existing ?: AtomicBoolean(false) }!!

    fun cancel(requestId: String) {
        requests.computeIfAbsent(requestId) { AtomicBoolean() }.set(true)
    }

    fun finish(requestId: String) {
        requests.remove(requestId)
    }
}
