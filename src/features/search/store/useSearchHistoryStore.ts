import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { SEARCH_HISTORY_LIMIT } from '@/features/search/constants/searchConstants';
import { appStorage, zustandStorage } from '@/services/storage/mmkv';

type SearchHistoryState = {
  searches: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
};



export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      searches: [],
      addSearch: (query) =>
        set((state) => {
          const normalizedQuery = query.trim();
          if (!normalizedQuery) return state;

          const filtered = state.searches.filter(
            (search) => search.toLowerCase() !== normalizedQuery.toLowerCase(),
          );
          return { searches: [normalizedQuery, ...filtered].slice(0, SEARCH_HISTORY_LIMIT) };
        }),
      removeSearch: (query) =>
        set((state) => ({
          searches: state.searches.filter((search) => search !== query),
        })),
      clearSearches: () => set({ searches: [] }),
    }),
    {
      name: 'genyt-native-search-history',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
