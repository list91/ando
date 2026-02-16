import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

const FAVORITES_STORAGE_KEY = 'ando_favorites';

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

// ЛК-3: Вспомогательные функции для работы с localStorage
const getLocalStorageFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Validate: must be an array
    if (!Array.isArray(parsed)) {
      console.warn('Invalid favorites format in localStorage, clearing...');
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      return [];
    }

    // Filter out non-string values
    const validFavorites = parsed.filter((id): id is string => typeof id === 'string');

    // If some items were filtered out, save the cleaned data
    if (validFavorites.length !== parsed.length) {
      console.warn(`Removed ${parsed.length - validFavorites.length} invalid favorite items`);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(validFavorites));
    }

    return validFavorites;
  } catch (error) {
    console.error('Error parsing favorites from localStorage:', error);
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    return [];
  }
};

const setLocalStorageFavorites = (favorites: string[]) => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
};

const clearLocalStorageFavorites = () => {
  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage favorites:', error);
  }
};

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMigrated, setHasMigrated] = useState(false);

  // ЛК-3: Загрузка избранного из localStorage для гостей
  const loadGuestFavorites = useCallback(() => {
    const guestFavorites = getLocalStorageFavorites();
    setFavorites(guestFavorites);
    setIsLoading(false);
  }, []);

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
  }, [user]);

  // ЛК-4: Миграция избранного гостя в БД при авторизации
  const migrateGuestFavorites = useCallback(async () => {
    if (!user || hasMigrated) return;

    const guestFavorites = getLocalStorageFavorites();
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

      const existingIds = new Set(existingFavorites?.map(f => f.product_id) || []);

      // Фильтруем только новые (которых ещё нет в БД)
      const newFavorites = guestFavorites.filter(id => !existingIds.has(id));

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
      clearLocalStorageFavorites();
      setHasMigrated(true);

      // Перезагружаем избранное из БД
      await loadDbFavorites();
    } catch (error) {
      console.error('Error migrating guest favorites:', error);
    }
  }, [user, hasMigrated, loadDbFavorites]);

  // Загрузка избранного при изменении пользователя
  useEffect(() => {
    if (user) {
      // Сначала мигрируем гостевые данные, потом загружаем из БД
      migrateGuestFavorites().then(() => loadDbFavorites());
    } else {
      // ЛК-3: Для гостей загружаем из localStorage
      loadGuestFavorites();
      setHasMigrated(false);
    }
  }, [user, loadGuestFavorites, loadDbFavorites, migrateGuestFavorites]);

  // ЛК-3: Добавление в избранное (работает и для гостей)
  const addToFavorites = async (productId: string) => {
    if (user) {
      // Авторизованный пользователь - сохраняем в БД
      try {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });

        if (error) throw error;

        setFavorites(prev => [...prev, productId]);
      } catch (error) {
        console.error('Error adding to favorites:', error);
      }
    } else {
      // ЛК-3: Гость - сохраняем в localStorage
      const updated = [...favorites, productId];
      setFavorites(updated);
      setLocalStorageFavorites(updated);
    }
  };

  // ЛК-3: Удаление из избранного (работает и для гостей)
  const removeFromFavorites = async (productId: string) => {
    if (user) {
      // Авторизованный пользователь - удаляем из БД
      try {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== productId));
      } catch (error) {
        console.error('Error removing from favorites:', error);
      }
    } else {
      // ЛК-3: Гость - удаляем из localStorage
      const updated = favorites.filter(id => id !== productId);
      setFavorites(updated);
      setLocalStorageFavorites(updated);
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.includes(productId);
  };

  const toggleFavorite = async (productId: string) => {
    if (isFavorite(productId)) {
      await removeFromFavorites(productId);
    } else {
      await addToFavorites(productId);
    }
  };

  // Геттер для гостевых избранных (используется при миграции)
  const getGuestFavorites = () => getLocalStorageFavorites();

  // Очистка гостевых избранных
  const clearGuestFavorites = () => {
    clearLocalStorageFavorites();
    if (!user) {
      setFavorites([]);
    }
  };

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
