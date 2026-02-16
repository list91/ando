import { useNavigate } from "react-router-dom";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-50"
        onClick={onClose}
      />
      
      <div data-testid="cart-drawer" className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl tracking-[0.15em] uppercase">Корзина</h2>
          <button onClick={onClose} className="hover:opacity-60 transition-opacity">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Корзина пуста</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-32 object-cover"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-sm mb-2">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">
                      Размер: {item.size}
                    </p>
                    <p className="text-sm font-medium mb-3">
                      {item.price} ₽
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.quantity - 1)
                          }
                          className="p-2 hover:bg-secondary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-4 text-sm">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.quantity + 1)
                          }
                          className="p-2 hover:bg-secondary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-xs underline hover:opacity-60 transition-opacity"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-6">
            <div className="flex justify-between mb-4 text-lg">
              <span>Итого:</span>
              <span className="font-medium">{totalPrice} ₽</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-foreground text-background py-4 text-sm tracking-wide uppercase hover:opacity-90 transition-opacity"
            >
              Оформить заказ
            </button>
            <button
              onClick={onClose}
              className="w-full mt-3 py-4 text-sm tracking-wide uppercase hover:opacity-60 transition-opacity"
            >
              Продолжить покупки
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
