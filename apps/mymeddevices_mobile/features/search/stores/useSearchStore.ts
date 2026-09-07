import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { generateUUID } from "@/utils/generateUUID";

export type SearchHistoryItem = {
  id: string;
  term: string;
  timestamp: number;
};

interface SearchHistoryState {
  searchHistory: SearchHistoryItem[];
  addSearchTerm: (term: string) => void;
  removeSearchTerm: (id: string) => void;
  clearSearchHistory: () => void;
  searchTermExists: (term: string) => boolean;
  getRecentSearches: (limit: number) => SearchHistoryItem[];
  loadSearchHistory: () => void;
}

const useSearchHistoryStore = create<SearchHistoryState>((set, get) => ({
  searchHistory: [],

  addSearchTerm: async (term: string) => {
    const newSearch: SearchHistoryItem = {
      id: generateUUID(),
      term,
      timestamp: Date.now(),
    };
    set((state) => ({
      searchHistory: [newSearch, ...state.searchHistory],
    }));
    await AsyncStorage.setItem(
      "searchHistory",
      JSON.stringify(get().searchHistory)
    );
  },

  removeSearchTerm: async (id: string) => {
    set((state) => ({
      searchHistory: state.searchHistory.filter((item) => item.id !== id),
    }));
    await AsyncStorage.setItem(
      "searchHistory",
      JSON.stringify(get().searchHistory)
    );
  },

  clearSearchHistory: async () => {
    set({ searchHistory: [] });
    await AsyncStorage.removeItem("searchHistory");
  },

  searchTermExists: (term: string) => {
    return get().searchHistory.some(
      (item) => item.term.toLowerCase() === term.toLowerCase()
    );
  },

  getRecentSearches: (limit: number) => {
    return get().searchHistory.slice(0, limit);
  },

  loadSearchHistory: async () => {
    const storedHistory = await AsyncStorage.getItem("searchHistory");
    if (storedHistory) {
      set({ searchHistory: JSON.parse(storedHistory) });
    }
  },
}));

export default useSearchHistoryStore;
