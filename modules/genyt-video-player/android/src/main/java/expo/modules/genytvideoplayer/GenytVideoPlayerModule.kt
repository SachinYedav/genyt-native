package expo.modules.genytvideoplayer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.os.Build
import android.app.PictureInPictureParams
import android.util.Rational

class GenytVideoPlayerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GenytVideoPlayer")

    Function("enterPiP") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val activity = appContext.currentActivity
        if (activity != null) {
          val params = PictureInPictureParams.Builder()
            .setAspectRatio(Rational(16, 9))
            .build()
          activity.enterPictureInPictureMode(params)
        }
      }
    }

    View(GenytVideoPlayerView::class) {
      Events(
        "onPlaybackStateChanged",
        "onProgress"
      )

      OnViewDestroys { view: GenytVideoPlayerView ->
        view.releasePlayer()
      }

      Prop("videoUri") { view: GenytVideoPlayerView, url: String? ->
        view.setVideoUri(url)
      }
      
      Prop("audioUri") { view: GenytVideoPlayerView, url: String? ->
        view.setAudioUri(url)
      }

      Prop("fallbackUri") { view: GenytVideoPlayerView, url: String? ->
        view.setFallbackUri(url)
      }

      Prop("streamSource") { view: GenytVideoPlayerView, source: Map<String, String?> ->
        view.setStreamSource(
            source["dashVideoUrl"],
            source["dashAudioUrl"],
            source["fallbackUrl"]
        )
      }

      Prop("isShortsMode") { view: GenytVideoPlayerView, isShorts: Boolean ->
        view.setIsShortsMode(isShorts)
      }

      Prop("resizeMode") { view: GenytVideoPlayerView, mode: String ->
        view.setResizeMode(mode)
      }

      AsyncFunction("play") { view: GenytVideoPlayerView ->
        view.play()
      }

      AsyncFunction("pause") { view: GenytVideoPlayerView ->
        view.pause()
      }

      AsyncFunction("seekTo") { view: GenytVideoPlayerView, positionMs: Double ->
        view.seekTo(positionMs)
      }

      AsyncFunction("setPlaybackRate") { view: GenytVideoPlayerView, rate: Float ->
        view.setPlaybackRate(rate)
      }
    }
  }
}
