import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedProduct, setLastAddedProduct] = useState<AddedProduct | null>(null);

  useEffect(() => {
    const handleClearCart = () => {
      setItems([]);
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
