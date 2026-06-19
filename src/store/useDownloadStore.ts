import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { MediaFormat } from '@/entities/video/types';
import { appStorage, zustandStorage } from '@/services/storage/mmkv';

export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'error';

export type DownloadTask = {
  id: string; // Typically `${videoId}-${format.id}`
  videoId: string;
  videoTitle: string;
  format: MediaFormat;
  progress: number; // 0 to 1
  status: DownloadStatus;
  localUri?: string;
  error?: string;
  thumbnailUrl?: string;
  bytesWritten: number;
  bytesExpected: number;
  resumeData?: string;
};

type DownloadState = {
  tasks: Record<string, DownloadTask>;
  addTask: (task: DownloadTask) => void;
  updateTaskProgress: (id: string, bytesWritten: number, bytesExpected: number) => void;
  updateTaskStatus: (id: string, status: DownloadStatus, extra?: Partial<DownloadTask>) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
};



export const useDownloadStore = create<DownloadState>()(
  persist(
    (set) => ({
      tasks: {},
      addTask: (task) =>
        set((state) => ({
          tasks: { ...state.tasks, [task.id]: task },
        })),
      updateTaskProgress: (id, bytesWritten, bytesExpected) =>
        set((state) => {
          const task = state.tasks[id];
          if (!task) return state;
          
          const progress = bytesExpected > 0 ? bytesWritten / bytesExpected : 0;
          return {
            tasks: {
              ...state.tasks,
              [id]: { ...task, bytesWritten, bytesExpected, progress },
            },
          };
        }),
      updateTaskStatus: (id, status, extra) =>
        set((state) => {
          const task = state.tasks[id];
          if (!task) return state;
          return {
            tasks: {
              ...state.tasks,
              [id]: { ...task, status, ...extra },
            },
          };
        }),
      removeTask: (id) =>
        set((state) => {
          const newTasks = { ...state.tasks };
          delete newTasks[id];
          return { tasks: newTasks };
        }),
      clearCompleted: () =>
        set((state) => {
          const newTasks = { ...state.tasks };
          Object.keys(newTasks).forEach((key) => {
            if (newTasks[key].status === 'completed') {
              delete newTasks[key];
            }
          });
          return { tasks: newTasks };
        }),
    }),
    {
      name: 'genyt-native-downloads',
      storage: createJSONStorage(() => zustandStorage),
      // We shouldn't persist 'downloading' status if the app is killed. 
      // On rehydration, any 'downloading' tasks should be reverted to 'paused' or 'pending'
      // since the memory DownloadResumable is lost and needs to be re-initialized.
      onRehydrateStorage: () => (state) => {
        if (state) {
          const newTasks = { ...state.tasks };
          let changed = false;
          Object.keys(newTasks).forEach((id) => {
            if (newTasks[id].status === 'downloading') {
              newTasks[id].status = 'paused';
              changed = true;
            }
          });
          if (changed) {
            state.tasks = newTasks;
          }
        }
      },
    },
  ),
);
