import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const FAVORITES_STORAGE_KEY = 'ando_favorites';

interface FavoritesState {
  // State
  favorites: string[]; // array of product IDs
  isLoading: boolean;
  hasMigrated: boolean;

  // Actions
  setFavorites: (favorites: string[]) => void;
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  setIsLoading: (loading: boolean) => void;

  // ЛК-4: Guest favorites migration methods
  migrateGuestFavorites: (guestFavorites: string[], existingDbFavorites: string[]) => string[];
  setHasMigrated: (value: boolean) => void;
  resetMigrationState: () => void;
  clearFavorites: () => void;
}

// Validation helper for favorites
const isValidFavoriteId = (id: unknown): id is string => typeof id === 'string' && id.length > 0;

// Custom storage with validation
const favoritesStorage = createJSONStorage<FavoritesState>(() => localStorage, {
  reviver: (_key, value) => value,
  replacer: (_key, value) => value,
});

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      // Initial state
      favorites: [],
      isLoading: true,
      hasMigrated: false,

      // Actions
      setFavorites: (favorites) => {
        set({ favorites: favorites.filter(isValidFavoriteId) });
      },

      addFavorite: (productId) => {
        if (!isValidFavoriteId(productId)) return;

        set((state) => {
          if (state.favorites.includes(productId)) {
            return state; // Already a favorite
          }
          return { favorites: [...state.favorites, productId] };
        });
      },

      removeFavorite: (productId) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== productId),
        }));
      },

      setIsLoading: (loading) => {
        set({ isLoading: loading });
      },

      // ЛК-4: Guest favorites migration
      // CRITICAL: Preserves exact migration logic from FavoritesContext
      // Returns array of NEW favorites that need to be inserted into DB
      migrateGuestFavorites: (guestFavorites, existingDbFavorites) => {
        const validGuestFavorites = guestFavorites.filter(isValidFavoriteId);

        if (validGuestFavorites.length === 0) {
          set({ hasMigrated: true });
          return [];
        }

        // Find favorites that don't exist in DB yet
        const existingIds = new Set(existingDbFavorites);
        const newFavorites = validGuestFavorites.filter((id) => !existingIds.has(id));

        set({ hasMigrated: true });

        console.log(`Guest favorites migration: ${newFavorites.length} new items to add`);
        return newFavorites;
      },

      setHasMigrated: (value) => {
        set({ hasMigrated: value });
      },

      resetMigrationState: () => {
        set({ hasMigrated: false });
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      storage: favoritesStorage,
      // Only persist favorites for guests, not loading/migration state
      partialize: (state) => ({
        favorites: state.favorites.filter(isValidFavoriteId),
      }),
      // Merge persisted state with initial state on rehydration
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<FavoritesState> | undefined;
        return {
          ...currentState,
          favorites: persisted?.favorites?.filter(isValidFavoriteId) ?? [],
          isLoading: false, // No longer loading after rehydration
        };
      },
    }
  )
);

// Selectors
export const selectFavorites = (state: FavoritesState) => state.favorites;
export const selectIsLoading = (state: FavoritesState) => state.isLoading;
export const selectHasMigrated = (state: FavoritesState) => state.hasMigrated;
export const selectIsFavorite = (productId: string) => (state: FavoritesState) =>
  state.favorites.includes(productId);

// Helper to get raw localStorage favorites (for migration before store hydration)
export const getGuestFavoritesFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Handle both old format (direct array) and new zustand persist format
    if (Array.isArray(parsed)) {
      return parsed.filter(isValidFavoriteId);
    }

    // Zustand persist format: { state: { favorites: [...] } }
    if (parsed?.state?.favorites && Array.isArray(parsed.state.favorites)) {
      return parsed.state.favorites.filter(isValidFavoriteId);
    }

    return [];
  } catch (error) {
    console.error('Error reading guest favorites from storage:', error);
    return [];
  }
};

// Helper to clear guest favorites from localStorage
export const clearGuestFavoritesFromStorage = (): void => {
  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing guest favorites from storage:', error);
  }
};

// Reset function for testing purposes
export const resetFavoritesStore = () => {
  useFavoritesStore.setState({
    favorites: [],
    isLoading: true,
    hasMigrated: false,
  });
};
