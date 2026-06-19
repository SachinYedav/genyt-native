package expo.modules.genytvideoplayer

import android.content.Context
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer

@UnstableApi
object PlayerPoolManager {
    private const val MAX_POOL_SIZE = 3
    private val pool = mutableListOf<ExoPlayer>()

    fun acquirePlayer(context: Context): ExoPlayer {
        if (pool.isNotEmpty()) {
            val player = pool.removeAt(pool.size - 1)
            player.stop()
            player.clearMediaItems()
            return player
        }

        val audioAttributes = AudioAttributes.Builder()
            .setUsage(C.USAGE_MEDIA)
            .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
            .build()

        val loadControl = androidx.media3.exoplayer.DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                1000,  // minBufferMs
                20000, // maxBufferMs
                500,  // bufferForPlaybackMs
                1000  // bufferForPlaybackAfterRebufferMs
            ).build()

        return ExoPlayer.Builder(context)
            .setAudioAttributes(audioAttributes, true)
            .setLoadControl(loadControl)
            .build()
    }

    fun releasePlayer(player: ExoPlayer) {
        player.stop()
        player.clearMediaItems()
        if (pool.size < MAX_POOL_SIZE) {
            pool.add(player)
        } else {
            player.release()
        }
    }
}
