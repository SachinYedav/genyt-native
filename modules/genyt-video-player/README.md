# GenYT Video Player & Downloader

This module handles media caching, robust background downloading, and deep integration with Android's Storage Access Framework (SAF) using the **Expo Modules API**.

## 🧠 Why an Expo Module?

Unlike the extractor (which needs to be lightning-fast and synchronous), downloading gigabytes of video or streaming to a media player takes time and must happen asynchronously. 

The Expo Modules API gives us a modern, clean Swift/Kotlin framework to build asynchronous functions that can run safely in the background using Promises and Coroutines.

## 🏗️ Core Components

| Component | Responsibility |
|---|---|
| `GenytDownloadManager.kt` | Executes chunked background downloading, injects dynamic `Range` headers for adaptive streams, and handles file writes. |
| `CacheManager.kt` | Integrates `SimpleCache` with ExoPlayer, allowing us to cache video chunks to disk as the user streams them. |
| `MediaStoreUtils.kt` | Safely bridges Android's Storage Access Framework (SAF) so we can write directly to public directories instead of being trapped in the app sandbox. |

## 🛡️ SAF (Storage Access Framework) Integration

One of GenYT Pro's core features is local file ownership. Rather than hiding downloaded videos inside the app's internal hidden data folder (which gets wiped if the app is uninstalled), our downloader requests permission to write to public folders.

By passing a `customSavePath` DocumentTree URI from the TypeScript Bridge down to `GenytDownloadManager`, we use Android's `DocumentFile` API to safely transfer massive media files directly to the user's SD Card or public "Downloads" directory.

## ⚠️ Important Developer Rules

**Coroutine Thread Governance:**
All disk I/O (reading/writing files) and network fetching handled by the DownloadManager must strictly be confined to `withContext(Dispatchers.IO)`. Never block the Main Native UI Thread, or Android will kill the app with an ANR (App Not Responding) crash.
