# GenYT Native Modules

Because React Native's JavaScript thread isn't meant to handle heavy data parsing, streaming decryption, or gigabyte-scale file I/O, we moved the heaviest lifting down to the native Android layer. 

This directory contains our proprietary Native Modules that bridge the gap between our React Native UI and the Android OS.

## 🧱 The Modules

We intentionally separated concerns into two distinct modules, using the best bridge technology suited for each job:

| Module | Core Responsibility | Bridge Architecture |
|---|---|---|
| `genyt-youtube-extractor` | Resolving streams, parsing search results, and interacting with NewPipe | **Nitro Modules** (Synchronous C++ JSI) |
| `genyt-video-player` | Background file downloading, ExoPlayer caching, SAF Storage | **Expo Modules API** (Asynchronous Coroutines) |

### 1. The Extractor (Synchronous)
We use [Nitro Modules](https://nitro.margelo.com/) for the extractor because we need the data *instantly*. By binding directly via C++ JSI, our JavaScript code can call Android Kotlin methods synchronously without waiting for the asynchronous React Native bridge. It makes scrolling and loading feeds feel incredibly snappy.

### 2. The Player & Downloader (Asynchronous)
We use the **Expo Modules API** for downloading and caching. Operations like writing a 1GB MP4 file to the user's SD card take time and must happen asynchronously in the background. Expo's `Promise` based API and coroutine support is perfect for this.

## ⚠️ Important Developer Rules

1. **Keep the Main Thread Clean:** Never run file operations or network requests on the main thread. Always wrap heavy Kotlin tasks in `withContext(Dispatchers.IO)` to prevent ANR (App Not Responding) crashes.
2. **Nitro Specs Codegen:** If you ever edit `YoutubeExtractor.nitro.ts` in the extractor module, you **must** run the spec generator before building Android:
   ```bash
   cd modules/genyt-youtube-extractor
   npm run specs
   ```
   If you forget, your C++ and Kotlin compiler will throw abstract method errors.
