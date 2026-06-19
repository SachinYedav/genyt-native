import { create } from 'zustand';
import type { VideoSummary } from '@/entities/video/types';

export type ActionContext = 'home' | 'search' | 'history' | 'watchlist' | 'library' | 'channel' | 'playlist_card';

export interface AnchorPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ActionMenuState {
  isOpen: boolean;
  video: VideoSummary | null;
  context: ActionContext;
  anchor: AnchorPosition | null;
  openMenu: (video: VideoSummary, context: ActionContext, anchor: AnchorPosition) => void;
  closeMenu: () => void;
}

export const useActionMenuStore = create<ActionMenuState>((set) => ({
  isOpen: false,
  video: null,
  context: 'home',
  anchor: null,
  openMenu: (video, context, anchor) => set({ isOpen: true, video, context, anchor }),
  closeMenu: () => set({ isOpen: false, video: null, anchor: null }),
}));
