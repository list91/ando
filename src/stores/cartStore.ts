import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const CART_STORAGE_KEY = 'ando_cart';

export interface CartItem {
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

interface CartState {
  // State
  items: CartItem[];
  lastAddedProduct: AddedProduct | null;
  isCartDrawerOpen: boolean;
  hasMigrated: boolean;

  // Computed (implemented as getters via selectors)
  // Actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  clearLastAdded: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;

  // ЛК-4: Guest cart migration methods
  migrateGuestCart: (guestCart: CartItem[]) => void;
  setHasMigrated: (value: boolean) => void;
  resetMigrationState: () => void;
}

// Validation helper for cart items
const isValidCartItem = (item: unknown): item is CartItem => {
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
};

// Custom storage with validation
const cartStorage = createJSONStorage<CartState>(() => localStorage, {
  reviver: (_key, value) => value,
  replacer: (_key, value) => value,
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      lastAddedProduct: null,
      isCartDrawerOpen: false,
      hasMigrated: false,

      // Actions
      addToCart: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.id === item.id && i.size === item.size
          );

          const newItems = existingItem
            ? state.items.map((i) =>
                i.id === item.id && i.size === item.size
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              )
            : [...state.items, { ...item, quantity: 1 }];

          return {
            items: newItems,
            lastAddedProduct: {
              name: item.name,
              price: item.price,
              size: item.size,
              color: item.color,
              image: item.image,
            },
          };
        });
      },

      removeFromCart: (id, size) => {
        set((state) => ({
          items: state.items.filter((i) => !(i.id === id && i.size === size)),
        }));
      },

      updateQuantity: (id, size, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id, size);
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.id === id && i.size === size ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearLastAdded: () => {
        set({ lastAddedProduct: null });
      },

      openCartDrawer: () => {
        set({ isCartDrawerOpen: true });
      },

      closeCartDrawer: () => {
        set({ isCartDrawerOpen: false });
      },

      // ЛК-4: Guest cart migration
      // CRITICAL: Preserves exact migration logic from CartContext
      // Merges guest cart items with existing items, increasing quantity for duplicates
      migrateGuestCart: (guestCart) => {
        if (guestCart.length === 0) {
          set({ hasMigrated: true });
          return;
        }

        set((state) => {
          const mergedItems = [...state.items];

          for (const guestItem of guestCart) {
            // Validate guest item before merging
            if (!isValidCartItem(guestItem)) {
              console.warn('Skipping invalid guest cart item:', guestItem);
              continue;
            }

            const existingIndex = mergedItems.findIndex(
              (item) => item.id === guestItem.id && item.size === guestItem.size
            );

            if (existingIndex >= 0) {
              // CART-7 FIX: Increase quantity of existing item
              mergedItems[existingIndex] = {
                ...mergedItems[existingIndex],
                quantity: mergedItems[existingIndex].quantity + guestItem.quantity,
              };
            } else {
              // Add new item
              mergedItems.push(guestItem);
            }
          }

          return {
            items: mergedItems,
            hasMigrated: true,
          };
        });

        console.log('Guest cart migrated successfully via Zustand store');
      },

      setHasMigrated: (value) => {
        set({ hasMigrated: value });
      },

      resetMigrationState: () => {
        set({ hasMigrated: false });
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: cartStorage,
      // Only persist items, not UI state or migration flags
      partialize: (state) => ({
        items: state.items.filter(isValidCartItem),
      }),
      // Merge persisted state with initial state on rehydration
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CartState> | undefined;
        return {
          ...currentState,
          items: persisted?.items?.filter(isValidCartItem) ?? [],
        };
      },
    }
  )
);

// Selectors for computed values
export const selectCartItems = (state: CartState) => state.items;
export const selectTotalItems = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectTotalPrice = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const selectLastAddedProduct = (state: CartState) => state.lastAddedProduct;
export const selectIsCartDrawerOpen = (state: CartState) => state.isCartDrawerOpen;
export const selectHasMigrated = (state: CartState) => state.hasMigrated;

// Reset function for testing purposes
export const resetCartStore = () => {
  useCartStore.setState({
    items: [],
    lastAddedProduct: null,
    isCartDrawerOpen: false,
    hasMigrated: false,
  });
};
