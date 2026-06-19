# GenYT YouTube Extractor

This module is the core data engine for GenYT Pro. It is a high-performance JSI bridge that connects React Native directly to the [NewPipe Extractor](https://github.com/TeamNewPipe/NewPipeExtractor) library using [Nitro Modules](https://nitro.margelo.com/).

## 🧠 Why Nitro Modules?

Usually, crossing the React Native bridge from JS to Native is asynchronous and relatively slow, which can cause UI stutter when parsing large amounts of search data or streams. 

By leveraging **Nitro Modules**, we bind our Kotlin functions directly to JavaScript via C++ JSI. This allows us to call complex extraction functions **synchronously**. The JS thread waits for the C++ pointer to return, completely bypassing the standard RN bridge. 

## 🏗️ How it Works

1. **The TypeScript Spec (`YoutubeExtractor.nitro.ts`):** We define our interface here.
2. **Nitro Codegen:** Running `npm run specs` auto-generates the C++ and Kotlin abstract classes based on our TypeScript spec.
3. **The Implementation (`HybridYoutubeExtractor.kt`):** We implement the abstract Kotlin class here.
4. **The Engine (`NewPipeExtractorEngine.kt`):** The implementation defers to this engine, which is a wrapper around the actual NewPipe Java library. It takes care of deciphering YouTube signatures, navigating the DOM, and returning clean metadata objects.

## 🚀 Capabilities

- **Search:** Search for videos, playlists, or channels.
- **Home Feed:** Fetches trending/algorithmic recommendations.
- **Stream Resolution:** Decrypts signatures and resolves the actual `.mp4` / `.webm` / `.m4a` URLs needed to play or download the video.
- **Details:** Fetches deep metadata for channels and playlists.

## 🛠️ Modifying the API

If you ever need to add a new function to the extractor:
1. Update `src/YoutubeExtractor.nitro.ts`
2. Run `npm run specs` inside this directory to generate the C++ bindings.
3. Implement the new method inside `android/src/main/java/com/margelo/nitro/genyt/extractor/HybridYoutubeExtractor.kt`.
4. Rebuild the Android app.
