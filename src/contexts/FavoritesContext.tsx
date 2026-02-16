import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  useFavoritesStore,
  selectFavorites,
  selectIsLoading,
  selectHasMigrated,
  getGuestFavoritesFromStorage,
  clearGuestFavoritesFromStorage,
} from '@/stores/favoritesStore';

interface FavoritesContextType {
  favorites: string[]; // array of product IDs
  isLoading: boolean;
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  migrateGuestFavorites: () => Promise<void>;
  getGuestFavorites: () => string[];
  clearGuestFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // Use Zustand store
  const favorites = useFavoritesStore(selectFavorites);
  const isLoading = useFavoritesStore(selectIsLoading);
  const hasMigrated = useFavoritesStore(selectHasMigrated);

  const setFavorites = useFavoritesStore((state) => state.setFavorites);
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const setIsLoading = useFavoritesStore((state) => state.setIsLoading);
  const migrateGuestFavoritesStore = useFavoritesStore((state) => state.migrateGuestFavorites);
  const setHasMigrated = useFavoritesStore((state) => state.setHasMigrated);
  const resetMigrationState = useFavoritesStore((state) => state.resetMigrationState);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);

  // ЛК-3: Загрузка избранного из localStorage для гостей
  const loadGuestFavorites = useCallback(() => {
    const guestFavorites = getGuestFavoritesFromStorage();
    setFavorites(guestFavorites);
    setIsLoading(false);
  }, [setFavorites, setIsLoading]);

  // Загрузка избранного из БД для авторизованных
  const loadDbFavorites = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data?.map(f => f.product_id) || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setFavorites, setIsLoading]);

  // ЛК-4: Миграция избранного гостя в БД при авторизации
  const migrateGuestFavorites = useCallback(async () => {
    if (!user || hasMigrated) return;

    const guestFavorites = getGuestFavoritesFromStorage();
    if (guestFavorites.length === 0) {
      setHasMigrated(true);
      return;
    }

    try {
      // Загружаем текущие избранные из БД
      const { data: existingFavorites } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      const existingIds = existingFavorites?.map(f => f.product_id) || [];

      // Use store's migration logic to get new favorites
      const newFavorites = migrateGuestFavoritesStore(guestFavorites, existingIds);

      if (newFavorites.length > 0) {
        // Добавляем новые в БД
        const { error } = await supabase
          .from('favorites')
          .insert(newFavorites.map(productId => ({
            user_id: user.id,
            product_id: productId
          })));

        if (error) throw error;
      }

      // ЛК-4: Очищаем localStorage после успешной миграции
      clearGuestFavoritesFromStorage();

      // Перезагружаем избранное из БД
      await loadDbFavorites();
    } catch (error) {
      console.error('Error migrating guest favorites:', error);
    }
  }, [user, hasMigrated, migrateGuestFavoritesStore, setHasMigrated, loadDbFavorites]);

  // Загрузка избранного при изменении пользователя
  useEffect(() => {
    if (user) {
      // Сначала мигрируем гостевые данные, потом загружаем из БД
      migrateGuestFavorites().then(() => loadDbFavorites());
    } else {
      // ЛК-3: Для гостей загружаем из localStorage
      loadGuestFavorites();
      resetMigrationState();
    }
  }, [user, loadGuestFavorites, loadDbFavorites, migrateGuestFavorites, resetMigrationState]);

  // ЛК-3: Добавление в избранное (работает и для гостей)
  const addToFavorites = useCallback(async (productId: string) => {
    if (user) {
      // Авторизованный пользователь - сохраняем в БД
      try {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });

        if (error) throw error;

        addFavorite(productId);
      } catch (error) {
        console.error('Error adding to favorites:', error);
      }
    } else {
      // ЛК-3: Гость - сохраняем через store (автоматически персистится)
      addFavorite(productId);
    }
  }, [user, addFavorite]);

  // ЛК-3: Удаление из избранного (работает и для гостей)
  const removeFromFavorites = useCallback(async (productId: string) => {
    if (user) {
      // Авторизованный пользователь - удаляем из БД
      try {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        removeFavorite(productId);
      } catch (error) {
        console.error('Error removing from favorites:', error);
      }
    } else {
      // ЛК-3: Гость - удаляем через store (автоматически персистится)
      removeFavorite(productId);
    }
  }, [user, removeFavorite]);

  const isFavorite = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (productId: string) => {
    if (isFavorite(productId)) {
      await removeFromFavorites(productId);
    } else {
      await addToFavorites(productId);
    }
  }, [isFavorite, removeFromFavorites, addToFavorites]);

  // Геттер для гостевых избранных (используется при миграции)
  const getGuestFavorites = useCallback(() => getGuestFavoritesFromStorage(), []);

  // Очистка гостевых избранных
  const clearGuestFavorites = useCallback(() => {
    clearGuestFavoritesFromStorage();
    if (!user) {
      clearFavorites();
    }
  }, [user, clearFavorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
        migrateGuestFavorites,
        getGuestFavorites,
        clearGuestFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
