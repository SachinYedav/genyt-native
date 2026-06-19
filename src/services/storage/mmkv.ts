import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const appStorage = createMMKV({
  id: 'genyt-native-storage',
});

// Reusable MMKV adapter for Zustand persist middleware
export const zustandStorage: StateStorage = {
  setItem: (name, value) => appStorage.set(name, value),
  getItem: (name) => {
    const value = appStorage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => appStorage.remove(name),
};
