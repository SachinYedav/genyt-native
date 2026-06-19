import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { zustandStorage } from '@/services/storage/mmkv';

interface SettingsState {
  backgroundPlay: boolean;
  pauseHistory: boolean;
  autoplay: boolean;
  downloadOverWifiOnly: boolean;
  downloadSavePath?: string;
  defaultPlayerPackage?: string;
  
  setBackgroundPlay: (enabled: boolean) => void;
  setPauseHistory: (paused: boolean) => void;
  setAutoplay: (autoplay: boolean) => void;
  toggleAutoplay: () => void;
  setDownloadOverWifiOnly: (downloadOverWifiOnly: boolean) => void;
  setDownloadSavePath: (path?: string) => void;
  setDefaultPlayerPackage: (pkg?: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      backgroundPlay: true,
      pauseHistory: false,
      autoplay: true,
      downloadOverWifiOnly: true,
      downloadSavePath: undefined,
      defaultPlayerPackage: undefined,

      setBackgroundPlay: (enabled) => set({ backgroundPlay: enabled }),
      setPauseHistory: (paused) => set({ pauseHistory: paused }),
      setAutoplay: (autoplay) => set({ autoplay }),
      toggleAutoplay: () => set((state) => ({ autoplay: !state.autoplay })),
      setDownloadOverWifiOnly: (downloadOverWifiOnly) => set({ downloadOverWifiOnly }),
      setDownloadSavePath: (path) => set({ downloadSavePath: path }),
      setDefaultPlayerPackage: (pkg) => set({ defaultPlayerPackage: pkg }),
    }),
    {
      name: 'genyt-settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
