import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    price: number;
    size?: string;
    color?: string;
    image: string;
  } | null;
}

export function AddToCartModal({ isOpen, onClose, product }: AddToCartModalProps) {
  const navigate = useNavigate();

  if (!product) return null;

  const handleGoToCart = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-sm tracking-[0.1em] uppercase">Товар успешно добавлен</h2>
        </div>
        
        <div className="p-6 flex gap-4">
          <div className="w-24 h-32 flex-shrink-0 bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <h3 className="text-sm mb-2 tracking-wide">{product.name}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {product.size && <p>Размер: {product.size}</p>}
                {product.color && <p>Цвет: {product.color}</p>}
              </div>
            </div>
            <p className="text-sm font-medium">{product.price} ₽</p>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={handleGoToCart}
            className="w-full bg-foreground text-background py-3 text-sm tracking-[0.1em] uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Перейти в корзину
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
