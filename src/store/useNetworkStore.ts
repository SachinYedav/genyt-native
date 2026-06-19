import { create } from 'zustand';
import * as Network from 'expo-network';

interface NetworkState {
  isOffline: boolean;
  setOffline: (isOffline: boolean) => void;
  initialize: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => {
  let unsubscribe: any = null;

  return {
    isOffline: false,
    setOffline: (isOffline) => set({ isOffline }),
    initialize: () => {
      // Get initial state
      Network.getNetworkStateAsync().then((state) => {
        set({ isOffline: state.isConnected === false });
      });

      // Listen for changes
      if (!unsubscribe) {
        unsubscribe = Network.addNetworkStateListener((state) => {
          set({ isOffline: state.isConnected === false });
        });
      }
    },
  };
});
