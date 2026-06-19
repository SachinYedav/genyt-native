package expo.modules.genytvideoplayer

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.sync.Semaphore
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

enum class DownloadState {
    QUEUED, DOWNLOADING, PAUSED, COMPLETED, FAILED
}

data class DownloadTask(
    val id: String,
    var url: String,
    val title: String,
    val fileName: String,
    val mimeType: String,
    var state: DownloadState = DownloadState.QUEUED,
    var bytesWritten: Long = 0,
    var totalBytes: Long = 0,
    var error: String? = null,
    var finalUri: String? = null,
    val customSavePath: String? = null
)

interface DownloadEventListener {
    fun onProgress(taskId: String, bytesWritten: Long, totalBytes: Long)
    fun onStateChanged(task: DownloadTask)
}

object GenytDownloadManager {
    private const val TAG = "GenytDownloadManager"
    private const val MAX_PARALLEL_DOWNLOADS = 2

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val semaphore = Semaphore(MAX_PARALLEL_DOWNLOADS)
    
    val tasks = ConcurrentHashMap<String, DownloadTask>()
    private val activeJobs = ConcurrentHashMap<String, Job>()

    var listener: DownloadEventListener? = null
    var context: Context? = null

    // Setup OkHttpClient with a NetworkInterceptor to ensure headers are NEVER stripped on redirects.
    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addNetworkInterceptor(Interceptor { chain ->
                val originalRequest = chain.request()

                // Inject headers matching NewPipe's browser identity.
                // No client spoofing — NewPipe stream URLs are generated with a web identity.
                val requestBuilder = originalRequest.newBuilder()
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
                    .header("Accept", "*/*")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Accept-Encoding", "identity")
                    .header("Connection", "keep-alive")

                val builtRequest = requestBuilder.build()
                
                val response = chain.proceed(builtRequest)
                
                if (response.code == 302 || response.code == 307 || response.code == 301) {
                    // Node hopping
                }
                
                response
            })
            .build()
    }

    private fun getCacheFile(taskId: String): File {
        val cacheDir = context?.cacheDir ?: throw Exception("Context not initialized")
        return File(cacheDir, "download_$taskId.part")
    }

    fun cleanupOrphanedPartFiles(ctx: Context) {
        val cacheDir = ctx.cacheDir ?: return
        val files = cacheDir.listFiles { _, name -> name.startsWith("download_") && name.endsWith(".part") } ?: return
        
        var deletedCount = 0
        var bytesFreed = 0L
        for (file in files) {
            val taskId = file.name.removePrefix("download_").removeSuffix(".part")
            // Delete if the task is NOT actively being tracked in memory
            if (!tasks.containsKey(taskId)) {
                bytesFreed += file.length()
                if (file.delete()) {
                    deletedCount++
                }
            }
        }
    }

    fun startDownload(taskId: String, url: String, title: String, fileName: String, mimeType: String, customSavePath: String? = null) {
        if (tasks.containsKey(taskId)) {
            val existingTask = tasks[taskId]!!
            if (existingTask.state == DownloadState.DOWNLOADING || existingTask.state == DownloadState.QUEUED) return
        }

        val task = DownloadTask(taskId, url, title, fileName, mimeType, customSavePath = customSavePath)
        tasks[taskId] = task
        
        // Check if there is an existing partial file
        val cacheFile = getCacheFile(taskId)
        if (cacheFile.exists()) {
            task.bytesWritten = cacheFile.length()
        }

        queueTask(task)
    }

    fun pauseDownload(taskId: String) {
        val task = tasks[taskId] ?: return
        if (task.state == DownloadState.DOWNLOADING || task.state == DownloadState.QUEUED) {
            task.state = DownloadState.PAUSED
            activeJobs[taskId]?.cancel()
            activeJobs.remove(taskId)
            listener?.onStateChanged(task)
        }
    }

    fun resumeDownload(taskId: String, newUrl: String?) {
        val task = tasks[taskId] ?: return
        if (newUrl != null) {
            task.url = newUrl // Update URL if re-resolved
        }
        if (task.state == DownloadState.PAUSED || task.state == DownloadState.FAILED) {
            task.state = DownloadState.QUEUED
            task.error = null
            queueTask(task)
        }
    }

    fun cancelDownload(taskId: String) {
        val task = tasks[taskId] ?: return
        task.state = DownloadState.FAILED
        task.error = "Cancelled by user"
        activeJobs[taskId]?.cancel()
        activeJobs.remove(taskId)
        tasks.remove(taskId)
        
        // Clean up partial file
        val cacheFile = getCacheFile(taskId)
        if (cacheFile.exists()) {
            cacheFile.delete()
        }
    }

    private fun queueTask(task: DownloadTask) {
        task.state = DownloadState.QUEUED
        listener?.onStateChanged(task)

        val job = scope.launch {
            semaphore.acquire() // Wait for a slot
            if (task.state != DownloadState.QUEUED) {
                semaphore.release()
                return@launch // Task was cancelled or paused while waiting
            }
            try {
                executeDownload(task)
            } catch (e: CancellationException) {
                // Job cancelled (paused or stopped)
            } catch (e: Exception) {
                Log.e(TAG, "Download error for ${task.id}", e)
                task.state = DownloadState.FAILED
                task.error = e.message ?: "Unknown error"
                listener?.onStateChanged(task)
            } finally {
                semaphore.release()
            }
        }
        activeJobs[task.id] = job
    }

    private suspend fun executeDownload(task: DownloadTask) = withContext(Dispatchers.IO) {
        task.state = DownloadState.DOWNLOADING
        listener?.onStateChanged(task)

        val cacheFile = getCacheFile(task.id)
        val downloadedBytes = if (cacheFile.exists()) cacheFile.length() else 0L
        task.bytesWritten = downloadedBytes

        val requestBuilder = Request.Builder()
            .url(task.url)
            .header("Range", "bytes=${downloadedBytes}-")

        val response = okHttpClient.newCall(requestBuilder.build()).execute()
        
        if (!response.isSuccessful) {
            if (response.code == 403) {
                throw Exception("HTTP_403") // Special error code for JS to trigger re-resolve
            } else if (response.code == 416) {
                // Range not satisfiable, file might be fully downloaded already. Or we requested wrong range.
                // Reset file and start over is safest if we can't verify.
                cacheFile.delete()
                throw Exception("HTTP_416: Invalid range, please resume again to restart.")
            }
            throw Exception("HTTP ${response.code}: ${response.message}")
        }

        val body = response.body ?: throw Exception("Empty response body")
        
        // If server didn't honor the Range header (returned 200 instead of 206), we must start over
        val append = downloadedBytes > 0 && response.code == 206
        if (!append && downloadedBytes > 0) {
            cacheFile.delete()
            task.bytesWritten = 0
        }

        val contentLength = body.contentLength()
        if (contentLength > 0) {
            task.totalBytes = if (append) downloadedBytes + contentLength else contentLength
        }

        var lastEmitTime = 0L
        body.byteStream().use { input ->
            FileOutputStream(cacheFile, append).use { output ->
                val buffer = ByteArray(8192)
                var bytesRead = 0
                while (isActive && input.read(buffer).also { bytesRead = it } != -1) {
                    output.write(buffer, 0, bytesRead)
                    task.bytesWritten += bytesRead

                    val now = System.currentTimeMillis()
                    if (now - lastEmitTime > 1000) {
                        lastEmitTime = now
                        listener?.onProgress(task.id, task.bytesWritten, task.totalBytes)
                    }
                }
            }
        }

        if (!isActive) {
            // Task was paused or cancelled, handled by finally block in queueTask
            throw CancellationException("Download cancelled or paused")
        }

        // Successfully downloaded. Move to MediaStore or Custom Save Path.
        val ctx = context ?: throw Exception("Context missing")
        val finalUri = if (!task.customSavePath.isNullOrEmpty()) {
            val directory = androidx.documentfile.provider.DocumentFile.fromTreeUri(ctx, android.net.Uri.parse(task.customSavePath))
                ?: throw Exception("Invalid SAF Tree URI")
            val newFile = directory.createFile(task.mimeType, task.fileName)
                ?: throw Exception("Failed to create file in SAF directory")
                
            ctx.contentResolver.openOutputStream(newFile.uri)?.use { outputStream ->
                java.io.FileInputStream(cacheFile).use { inputStream ->
                    inputStream.copyTo(outputStream)
                }
            }
            cacheFile.delete()
            newFile.uri.toString()
        } else {
            MediaStoreUtils.moveToPublicDownloads(ctx, cacheFile, task.fileName, task.mimeType)
        }
        
        task.state = DownloadState.COMPLETED
        task.finalUri = finalUri
        listener?.onStateChanged(task)
        activeJobs.remove(task.id)
        tasks.remove(task.id)
    }
}
