package expo.modules.genytvideoplayer

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.io.File
import java.io.FileInputStream
import java.io.OutputStream

object MediaStoreUtils {
    /**
     * Copies a temporary cache file to the public Downloads/GenYT/ directory using MediaStore.
     * This avoids Android 10+ Scoped Storage restrictions and doesn't require invasive permissions.
     */
    fun moveToPublicDownloads(context: Context, sourceFile: File, fileName: String, mimeType: String): String {
        val resolver = context.contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Save to Download/GenYT directory
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/GenYT")
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
        }

        val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Downloads.EXTERNAL_CONTENT_URI
        } else {
            MediaStore.Files.getContentUri("external")
        }

        val itemUri = resolver.insert(collection, contentValues)
            ?: throw Exception("Failed to create MediaStore entry for $fileName")

        try {
            resolver.openOutputStream(itemUri)?.use { outputStream ->
                FileInputStream(sourceFile).use { inputStream ->
                    inputStream.copyTo(outputStream)
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                contentValues.clear()
                contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                resolver.update(itemUri, contentValues, null, null)
            }

            // Cleanup the temporary cache file
            sourceFile.delete()

            return itemUri.toString()
        } catch (e: Exception) {
            // If copying failed, try to delete the pending media store entry
            resolver.delete(itemUri, null, null)
            throw e
        }
    }
}
