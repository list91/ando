import { createContext, useContext, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  useCartStore,
  selectCartItems,
  selectTotalItems,
  selectTotalPrice,
  selectLastAddedProduct,
  selectIsCartDrawerOpen,
  selectHasMigrated,
  CartItem,
  AddedProduct,
} from "@/stores/cartStore";

// Re-export types for backward compatibility
export type { CartItem, AddedProduct } from "@/stores/cartStore";

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

// Helper to get guest cart from localStorage (before Zustand hydration)
const getLocalStorageCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem('ando_cart');
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Handle both old format (direct array) and new zustand persist format
    let cartArray: unknown[];

    if (Array.isArray(parsed)) {
      cartArray = parsed;
    } else if (parsed?.state?.items && Array.isArray(parsed.state.items)) {
      // Zustand persist format: { state: { items: [...] } }
      cartArray = parsed.state.items;
    } else {
      return [];
    }

    // Validate each cart item has required fields
    const validCart = cartArray.filter((item): item is CartItem => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as CartItem).id === 'string' &&
        typeof (item as CartItem).name === 'string' &&
        typeof (item as CartItem).price === 'number' &&
        typeof (item as CartItem).size === 'string' &&
        typeof (item as CartItem).color === 'string' &&
        typeof (item as CartItem).image === 'string' &&
        typeof (item as CartItem).quantity === 'number' &&
        (item as CartItem).quantity > 0
      );
    });

    return validCart;
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    return [];
  }
};

const clearLocalStorageCart = () => {
  try {
    localStorage.removeItem('ando_cart');
  } catch (error) {
    console.error('Error clearing localStorage cart:', error);
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // Use Zustand store
  const items = useCartStore(selectCartItems);
  const totalItems = useCartStore(selectTotalItems);
  const totalPrice = useCartStore(selectTotalPrice);
  const lastAddedProduct = useCartStore(selectLastAddedProduct);
  const isCartDrawerOpen = useCartStore(selectIsCartDrawerOpen);
  const hasMigrated = useCartStore(selectHasMigrated);

  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearLastAdded = useCartStore((state) => state.clearLastAdded);
  const openCartDrawer = useCartStore((state) => state.openCartDrawer);
  const closeCartDrawer = useCartStore((state) => state.closeCartDrawer);
  const migrateGuestCartStore = useCartStore((state) => state.migrateGuestCart);
  const resetMigrationState = useCartStore((state) => state.resetMigrationState);

  // ЛК-4: Миграция корзины гостя при авторизации
  const migrateGuestCart = useCallback(async () => {
    if (!user || hasMigrated) return;

    const guestCart = getLocalStorageCart();
    if (guestCart.length === 0) {
      migrateGuestCartStore([]);
      return;
    }

    try {
      migrateGuestCartStore(guestCart);
      // CART-6 FIX: Clear localStorage only after successful migration
      clearLocalStorageCart();
      console.log('Guest cart migrated successfully');
    } catch (error) {
      console.error('Error migrating guest cart:', error);
    }
  }, [user, hasMigrated, migrateGuestCartStore]);

  // Автоматическая миграция при авторизации
  useEffect(() => {
    if (user && !hasMigrated) {
      migrateGuestCart();
    }
    if (!user) {
      resetMigrationState();
    }
  }, [user, hasMigrated, migrateGuestCart, resetMigrationState]);

  // Handle clearCart event (for checkout completion, etc.)
  useEffect(() => {
    const handleClearCart = () => {
      clearCart();
      clearLocalStorageCart();
    };

    window.addEventListener('clearCart', handleClearCart);
    return () => window.removeEventListener('clearCart', handleClearCart);
  }, [clearCart]);

  // Геттер для гостевой корзины (используется при миграции)
  const getGuestCart = useCallback(() => getLocalStorageCart(), []);

  // Очистка гостевой корзины
  const clearGuestCart = useCallback(() => {
    clearLocalStorageCart();
  }, []);

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
