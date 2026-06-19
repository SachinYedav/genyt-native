package expo.modules.genytvideoplayer

import android.content.Context
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import android.util.Log
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import android.os.Handler
import android.os.Looper
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.source.MergingMediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.datasource.DefaultHttpDataSource

import android.net.Uri

@androidx.media3.common.util.UnstableApi
class GenytVideoPlayerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    private val playerView = PlayerView(context)
    private var exoPlayer: ExoPlayer? = null
    
    private val onPlaybackStateChanged by EventDispatcher()
    private val onProgress by EventDispatcher()

    private var videoUrl: String? = null
    private var audioUrl: String? = null
    private var fallbackUrl: String? = null
    private var isShorts: Boolean = false

    private val handler = Handler(Looper.getMainLooper())
    private var isTrackingProgress = false

    private val progressRunnable = object : Runnable {
        override fun run() {
            if (isTrackingProgress) {
                exoPlayer?.let { player ->
                    onProgress(mapOf(
                        "currentTime" to player.currentPosition / 1000.0,
                        "duration" to player.duration / 1000.0,
                        "bufferedPosition" to player.bufferedPosition / 1000.0
                    ))
                }
                handler.postDelayed(this, 500)
            }
        }
    }

    init {
        playerView.layoutParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        playerView.useController = false // Headless UI
        playerView.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
        playerView.setBackgroundColor(android.graphics.Color.TRANSPARENT)
        playerView.setShutterBackgroundColor(android.graphics.Color.TRANSPARENT)
        
        addView(playerView)
    }

    private fun setupPlayer() {
        if (exoPlayer == null) {
            exoPlayer = PlayerPoolManager.acquirePlayer(context).apply {
                playerView.player = this
                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        val stateStr = when (playbackState) {
                            Player.STATE_IDLE -> "idle"
                            Player.STATE_BUFFERING -> "buffering"
                            Player.STATE_READY -> "ready"
                            Player.STATE_ENDED -> "ended"
                            else -> "unknown"
                        }
                        onPlaybackStateChanged(mapOf("state" to stateStr))
                    }
                    
                    override fun onIsPlayingChanged(isPlaying: Boolean) {
                        onPlaybackStateChanged(mapOf("isPlaying" to isPlaying))
                        if (isPlaying) startProgressTracker() else stopProgressTracker()
                    }

                    override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                        // Execute seamless fallback to 360p progressive stream if DASH fails
                        if (fallbackUrl != null && videoUrl != fallbackUrl) {
                            val player = this@apply
                            val currentPos = player.currentPosition
                            
                            val headers = mapOf(
                                "User-Agent" to "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                                "Accept" to "*/*",
                                "Accept-Language" to "en-US,en;q=0.9"
                            )
                            val dataSourceFactory = DefaultHttpDataSource.Factory()
                                .setAllowCrossProtocolRedirects(true)
                                .setDefaultRequestProperties(headers)
                                
                            val fallbackSource = androidx.media3.exoplayer.source.DefaultMediaSourceFactory(dataSourceFactory)
                                .createMediaSource(MediaItem.fromUri(Uri.parse(fallbackUrl)))
                            
                            player.setMediaSource(fallbackSource)
                            player.seekTo(currentPos)
                            player.prepare()
                            player.playWhenReady = true
                            
                            // Prevent infinite fallback loops
                            videoUrl = fallbackUrl
                            audioUrl = null
                        } else {
                            onPlaybackStateChanged(mapOf("state" to "error"))
                        }
                    }
                })
            }
            if (videoUrl != null) {
                prepareMedia()
            }
        }
    }

    fun setVideoUri(url: String?) {
        this.videoUrl = url
        prepareMedia()
    }

    fun setAudioUri(url: String?) {
        this.audioUrl = url
        prepareMedia()
    }

    fun setFallbackUri(url: String?) {
        this.fallbackUrl = url
    }

    fun setStreamSource(dashVideoUrl: String?, dashAudioUrl: String?, fallbackUrl: String?) {
        this.videoUrl = dashVideoUrl
        this.audioUrl = dashAudioUrl
        this.fallbackUrl = fallbackUrl
        prepareMedia()
    }

    fun setIsShortsMode(isShorts: Boolean) {
        this.isShorts = isShorts
        exoPlayer?.repeatMode = if (isShorts) Player.REPEAT_MODE_ALL else Player.REPEAT_MODE_OFF
    }

    fun setResizeMode(mode: String) {
        playerView.resizeMode = when (mode) {
            "cover" -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
            "contain" -> AspectRatioFrameLayout.RESIZE_MODE_FIT
            "stretch" -> AspectRatioFrameLayout.RESIZE_MODE_FILL
            else -> AspectRatioFrameLayout.RESIZE_MODE_FIT
        }
    }

    private fun prepareMedia() {
        setupPlayer()
        val player = exoPlayer ?: return
        val vUrl = videoUrl ?: return

        Log.d("GenytPlayer", "[DEBUG_NATIVE] prepareMedia called. VideoUrl: $vUrl, AudioUrl: $audioUrl")

        val headers = mapOf(
            "User-Agent" to "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept" to "*/*",
            "Accept-Language" to "en-US,en;q=0.9"
        )
        val dataSourceFactory = DefaultHttpDataSource.Factory()
            .setAllowCrossProtocolRedirects(true)
            .setDefaultRequestProperties(headers)

        // Using DefaultMediaSourceFactory correctly detects and parses DASH vs Progressive formats
        val mediaSourceFactory = androidx.media3.exoplayer.source.DefaultMediaSourceFactory(dataSourceFactory)

        val videoSource = mediaSourceFactory.createMediaSource(MediaItem.fromUri(Uri.parse(vUrl)))

        val finalSource = if (audioUrl != null) {
            val audioSource = mediaSourceFactory.createMediaSource(MediaItem.fromUri(Uri.parse(audioUrl!!)))
            MergingMediaSource(videoSource, audioSource)
        } else {
            videoSource
        }

        player.setMediaSource(finalSource)
        player.prepare()
        player.playWhenReady = true
    }

    fun play() {
        exoPlayer?.play()
    }

    fun pause() {
        exoPlayer?.pause()
    }

    fun seekTo(seconds: Double) {
        exoPlayer?.seekTo((seconds * 1000).toLong())
    }

    fun setPlaybackRate(rate: Float) {
        exoPlayer?.playbackParameters = androidx.media3.common.PlaybackParameters(rate, 1.0f)
    }

    private fun startProgressTracker() {
        if (!isTrackingProgress) {
            isTrackingProgress = true
            handler.post(progressRunnable)
        }
    }

    private fun stopProgressTracker() {
        isTrackingProgress = false
        handler.removeCallbacks(progressRunnable)
    }

    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        if (visibility != android.view.View.VISIBLE) {
            exoPlayer?.pause()
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        // Do NOT release exoPlayer here! React Native detaches and reattaches views during Fullscreen style transitions.
        // Releasing here causes the indefinite buffering issue.
    }

    fun releasePlayer() {
        stopProgressTracker()
        exoPlayer?.let { PlayerPoolManager.releasePlayer(it) }
        exoPlayer = null
        playerView.player = null
    }
}
