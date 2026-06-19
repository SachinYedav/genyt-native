# GenYT Pro

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB)](#)
[![C++ JSI](https://img.shields.io/badge/C++_JSI-00599C?style=flat-square&logo=c%2B%2B&logoColor=white)](#)
[![Platform: Android](https://img.shields.io/badge/Platform-Android-3DDC84?style=flat-square&logo=android&logoColor=white)](#)
[![Local First](https://img.shields.io/badge/Privacy-Local_First-blueviolet?style=flat-square)](#)

**A completely local-first, privacy-focused YouTube client.** Built natively with React Native (Expo) & C++ JSI for zero-bridge overhead and maximum performance.

---

## 🎯 Our Philosophy

Our philosophy is simple: **Your data stays on your device.** 
There are no backend servers, no cloud telemetry, and no account requirements. Everything from your watch history and saved playlists to offline video downloads is managed entirely on your local storage using SQLite and Android's native file system.

---

## 🏗️ Architecture at a Glance

GenYT Pro isn't just a standard React Native app. We heavily rely on custom native code to achieve performance and capabilities that JavaScript alone simply cannot handle. The project is split into the frontend UI layer and the native engine layer:

- 🎨 **UI & State:** Built with React Native, React Navigation, FlashList, and Zustand. We strictly follow modern design patterns (glassmorphism, dark mode, smooth micro-animations).
- ⚡ **Extraction Engine (`genyt-youtube-extractor`):** A custom C++ JSI module powered by **Nitro Modules**. It wraps the robust, community-maintained **NewPipe Extractor** in Android/Kotlin to synchronously resolve video streams and search results directly into the JavaScript thread with *zero bridge overhead*.
- 💾 **Media & Downloads (`genyt-video-player`):** A custom Expo Module that handles background downloading, ExoPlayer caching, and SAF (Storage Access Framework) integration so users can save gigabytes of video directly to their public Downloads folder or SD card.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Android Studio & Android SDK** (Required for compiling custom native modules)
- **Expo CLI**

### Local Development
Because GenYT Pro uses custom native C++ and Kotlin modules, you **cannot** run this via the standard "Expo Go" app. You must build a custom native client.

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Android Build:**
   ```bash
   npm run android
   ```
   *(This will compile the C++ Nitro specs, the Kotlin NewPipe wrapper, and the React Native bundle, then deploy it to your emulator/connected device).*

---

## 🛠️ Codebase Structure

- 📂 `/src`: All React Native frontend code.
  - `/features`: Domain-driven modules (home, search, watch, downloads, etc.).
  - `/shared`: Reusable UI components, theme tokens, and utilities.
  - `/services`: SQLite database schemas, queries, and JS abstractions over our native modules.
- ⚙️ `/modules`: The heart of our native backend.
  - `/genyt-youtube-extractor`: The JSI/Nitro bridge wrapping NewPipe.
  - `/genyt-video-player`: The Expo Module for background downloading and caching.
- 📜 `/scripts`: Build utilities (like the automated open-source license generator).

---

## 🤝 Open Source & Licensing

GenYT Pro relies on several amazing open-source projects, most notably [NewPipe Extractor](https://github.com/TeamNewPipe/NewPipeExtractor). You can view the full list of licenses directly within the app's Settings menu.

*Please review the local `LICENSE` file for usage rights and restrictions.*

---

## 🤖 The "Vibe Coded" Experiment

> **Built with deep focus, hard work, and AI Agent Workflows.**

GenYT Pro is a deeply architectural project that was brought to life entirely through AI-driven "Vibe Coding." Despite its AI origins, this is not a shallow prototype. Immense effort, rigorous architectural planning, and meticulous debugging went into crafting both the C++ JSI backend and the micro-animations of the UI. 

Because it pushes the boundaries of AI-assisted mobile development (and relies on community scrapers like NewPipe), you might encounter occasional edge cases or bugs. It stands as a testament to what is possible when deep technical persistence meets AI workflows. We welcome debugging, forks, and contributions from the community!
