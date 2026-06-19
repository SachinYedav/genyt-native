import { create } from 'zustand';
import type { VideoSummary } from '@/entities/video/types';

interface PlayerState {
  activeVideo: VideoSummary | null;
  queue: VideoSummary[];
  currentIndex: number;
  isShuffle: boolean;
  playerState: 'expanded' | 'minimized' | 'closed';
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  playVideo: (video: VideoSummary) => void;
  playQueue: (videos: VideoSummary[], startIndex?: number, shuffle?: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
  minimizeVideo: () => void;
  expandVideo: () => void;
  closeVideo: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  activeVideo: null,
  queue: [],
  currentIndex: -1,
  isShuffle: false,
  playerState: 'closed',
  isFullscreen: false,
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  playVideo: (video) => set({ 
    activeVideo: video, 
    queue: [video],
    currentIndex: 0,
    playerState: 'expanded', 
    isPlaying: true 
  }),
  playQueue: (videos, startIndex = 0, shuffle = false) => {
    if (!videos.length) return;
    
    let queueToPlay = [...videos];
    let initialIndex = startIndex;

    if (shuffle) {
      const startVideo = queueToPlay[startIndex];
      queueToPlay = queueToPlay.filter((_, i) => i !== startIndex).sort(() => Math.random() - 0.5);
      if (startVideo) {
        queueToPlay.unshift(startVideo);
      }
      initialIndex = 0;
    }

    set({
      queue: queueToPlay,
      currentIndex: initialIndex,
      activeVideo: queueToPlay[initialIndex],
      isShuffle: shuffle,
      playerState: 'expanded',
      isPlaying: true
    });
  },
  playNext: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      set({ currentIndex: nextIndex, activeVideo: queue[nextIndex], isPlaying: true });
    } else {
      set({ isPlaying: false });
    }
  },
  playPrevious: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      set({ currentIndex: prevIndex, activeVideo: queue[prevIndex], isPlaying: true });
    }
  },
  minimizeVideo: () => set({ playerState: 'minimized', isFullscreen: false }),
  expandVideo: () => set({ playerState: 'expanded' }),
  closeVideo: () => set({ 
    activeVideo: null, 
    queue: [],
    currentIndex: -1,
    playerState: 'closed', 
    isFullscreen: false,
    isPlaying: false 
  }),
}));
