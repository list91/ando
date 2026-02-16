import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";

const CART_STORAGE_KEY = 'ando_cart';

interface CartItem {
  id: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  quantity: number;
}

export interface AddedProduct {
  name: string;
  price: number;
  size?: string;
  color?: string;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  lastAddedProduct: AddedProduct | null;
  clearLastAdded: () => void;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  migrateGuestCart: () => Promise<void>;
  getGuestCart: () => CartItem[];
  clearGuestCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ЛК-3: Вспомогательные функции для работы с localStorage
const getLocalStorageCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Validate: must be an array
    if (!Array.isArray(parsed)) {
      console.warn('Invalid cart format in localStorage, clearing...');
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }

    // Validate each cart item has required fields
    const validCart = parsed.filter((item): item is CartItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        typeof item.size === 'string' &&
        typeof item.color === 'string' &&
        typeof item.image === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      );
    });

    // If some items were filtered out, save the cleaned data
    if (validCart.length !== parsed.length) {
      console.warn(`Removed ${parsed.length - validCart.length} invalid cart items`);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validCart));
    }

    return validCart;
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
};

const setLocalStorageCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const clearLocalStorageCart = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage cart:', error);
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedProduct, setLastAddedProduct] = useState<AddedProduct | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  // ЛК-3: Загрузка корзины из localStorage при инициализации
  useEffect(() => {
    const savedCart = getLocalStorageCart();
    if (savedCart.length > 0) {
      setItems(savedCart);
    }
  }, []);

  // ЛК-3: Сохранение корзины в localStorage при изменениях (для гостей)
  useEffect(() => {
    if (!user) {
      setLocalStorageCart(items);
    }
  }, [items, user]);

  // ЛК-4: Миграция корзины гостя при авторизации
  const migrateGuestCart = useCallback(async () => {
    if (!user || hasMigrated) return;

    const guestCart = getLocalStorageCart();
    if (guestCart.length === 0) {
      setHasMigrated(true);
      return;
    }

    try {
      // CART-7 FIX: Используем functional setState для избежания race condition
      setItems(prevItems => {
        const mergedItems = [...prevItems];

        for (const guestItem of guestCart) {
          const existingIndex = mergedItems.findIndex(
            item => item.id === guestItem.id && item.size === guestItem.size
          );

          if (existingIndex >= 0) {
            // Увеличиваем количество существующего товара
            mergedItems[existingIndex] = {
              ...mergedItems[existingIndex],
              quantity: mergedItems[existingIndex].quantity + guestItem.quantity
            };
          } else {
            // Добавляем новый товар
            mergedItems.push(guestItem);
          }
        }

        return mergedItems;
      });

      // CART-6 FIX: clearLocalStorageCart теперь внутри try блока,
      // очистка происходит только после успешного обновления состояния
      clearLocalStorageCart();
      setHasMigrated(true);

      console.log('Guest cart migrated successfully');
    } catch (error) {
      console.error('Error migrating guest cart:', error);
    }
  }, [user, hasMigrated]);

  // Автоматическая миграция при авторизации
  useEffect(() => {
    if (user && !hasMigrated) {
      migrateGuestCart();
    }
    if (!user) {
      setHasMigrated(false);
    }
  }, [user, hasMigrated, migrateGuestCart]);

  useEffect(() => {
    const handleClearCart = () => {
      setItems([]);
      clearLocalStorageCart();
    };

    window.addEventListener('clearCart', handleClearCart);
    return () => window.removeEventListener('clearCart', handleClearCart);
  }, []);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (i) => i.id === item.id && i.size === item.size
      );

      if (existingItem) {
        return currentItems.map((i) =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...currentItems, { ...item, quantity: 1 }];
    });

    // Set last added product for modal
    setLastAddedProduct({
      name: item.name,
      price: item.price,
      size: item.size,
      color: item.color,
      image: item.image,
    });
  };

  const clearLastAdded = () => {
    setLastAddedProduct(null);
  };

  const removeFromCart = (id: string, size: string) => {
    setItems((currentItems) =>
      currentItems.filter((i) => !(i.id === id && i.size === size))
    );
  };

  const updateQuantity = (id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, size);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((i) =>
        i.id === id && i.size === size ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    clearLocalStorageCart();
  };

  // Геттер для гостевой корзины (используется при миграции)
  const getGuestCart = () => getLocalStorageCart();

  // Очистка гостевой корзины
  const clearGuestCart = () => {
    clearLocalStorageCart();
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        lastAddedProduct,
        clearLastAdded,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        migrateGuestCart,
        getGuestCart,
        clearGuestCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
