package com.genyt.extractor.network

import android.util.Log
import org.schabi.newpipe.extractor.downloader.Downloader
import org.schabi.newpipe.extractor.downloader.Request
import org.schabi.newpipe.extractor.downloader.Response
import java.io.IOException
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

/**
 * Zero-opinion NewPipe Downloader — pure pass-through.
 *
 * This downloader applies ONLY the headers that NewPipe's extractors
 * provide via [Request.headers]. No hardcoded User-Agent, no injected
 * Accept-Encoding, no custom overrides. This ensures NewPipe's internal
 * client spoofing (iOS, Android, TV) works exactly as intended for
 * extracting DASH streams.
 *
 * Modeled after the real NewPipe Android app's DownloaderImpl.
 */
class NewPipeDownloader private constructor() : Downloader() {

    companion object {
        private const val TAG = "NewPipeDownloader"

        @Volatile
        private var instance: NewPipeDownloader? = null

        fun getInstance(): NewPipeDownloader {
            return instance ?: synchronized(this) {
                instance ?: NewPipeDownloader().also { instance = it }
            }
        }
    }

    @Throws(IOException::class)
    override fun execute(request: Request): Response {
        val url = request.url()
        val method = request.httpMethod()
        val headers = request.headers()
        val dataToSend = request.dataToSend()

        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 30_000
            readTimeout = 30_000
            instanceFollowRedirects = true

            // Apply headers NewPipe provides — these may override the UA above
            // if NewPipe's internal client spoofing needs a different identity
            headers?.forEach { (key, values) ->
                values.forEachIndexed { index, value ->
                    if (index == 0) {
                        setRequestProperty(key, value)
                    } else {
                        addRequestProperty(key, value)
                    }
                }
            }

            // Write POST/PUT body if present
            if (dataToSend != null && dataToSend.isNotEmpty()) {
                doOutput = true
                outputStream.apply {
                    write(dataToSend)
                    flush()
                    close()
                }
            }
        }

        return try {
            val statusCode = connection.responseCode
            val responseMessage = connection.responseMessage ?: ""
            val responseHeaders = connection.headerFields
                ?.filterKeys { it != null }
                ?.mapValues { (_, values) -> values ?: emptyList() }
                ?: emptyMap()

            val stream = if (statusCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream ?: connection.inputStream
            }

            // Handle GZIP transparently if the server sends it
            // (HttpURLConnection handles this automatically when Accept-Encoding
            // is NOT manually set — which is our case now)
            val body = stream?.let { InputStreamReader(it, "UTF-8").use { r -> r.readText() } } ?: ""

            Log.d(TAG, "$method ${url.take(120)} → $statusCode (${body.length} chars)")
            Response(statusCode, responseMessage, responseHeaders, body, url)
        } catch (e: Exception) {
            Log.e(TAG, "Request failed: $method $url", e)
            throw IOException("NewPipeDownloader request failed: ${e.message}", e)
        } finally {
            connection.disconnect()
        }
    }
}
