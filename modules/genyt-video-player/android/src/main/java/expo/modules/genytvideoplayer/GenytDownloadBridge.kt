package expo.modules.genytvideoplayer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GenytDownloadBridge : Module() {
    override fun definition() = ModuleDefinition {
        Name("GenytDownloadBridge")

        Events(
            "onDownloadProgress",
            "onDownloadStateChanged"
        )

        OnCreate {
            val reactContext = appContext.reactContext
            GenytDownloadManager.context = reactContext
            
            if (reactContext != null) {
                GenytDownloadManager.cleanupOrphanedPartFiles(reactContext)
            }

            GenytDownloadManager.listener = object : DownloadEventListener {
                override fun onProgress(taskId: String, bytesWritten: Long, totalBytes: Long) {
                    sendEvent("onDownloadProgress", mapOf(
                        "taskId" to taskId,
                        "bytesWritten" to bytesWritten,
                        "totalBytes" to totalBytes
                    ))
                }

                override fun onStateChanged(task: DownloadTask) {
                    val map = mutableMapOf<String, Any>(
                        "taskId" to task.id,
                        "state" to task.state.name
                    )
                    task.error?.let { map["error"] = it }
                    task.finalUri?.let { map["finalUri"] = it }
                    
                    sendEvent("onDownloadStateChanged", map)
                }
            }
        }

        Function("startNativeDownload") { taskId: String, url: String, title: String, fileName: String, mimeType: String, customSavePath: String? ->
            GenytDownloadManager.startDownload(taskId, url, title, fileName, mimeType, customSavePath)
        }

        Function("pauseNativeDownload") { taskId: String ->
            GenytDownloadManager.pauseDownload(taskId)
        }

        Function("resumeNativeDownload") { taskId: String, newUrl: String? ->
            GenytDownloadManager.resumeDownload(taskId, newUrl)
        }

        Function("cancelNativeDownload") { taskId: String ->
            GenytDownloadManager.cancelDownload(taskId)
        }
    }
}
