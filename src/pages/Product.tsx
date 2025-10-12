import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useProduct } from "@/hooks/useProducts";
import { toast } from "sonner";

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { data: product, isLoading } = useProduct(id || '');
  
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Товар не найден</p>
        <Link to="/catalog" className="underline">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const images = product.product_images?.sort((a, b) => a.display_order - b.display_order) || [];
  const mainImages = images.length > 0 
    ? images.map(img => img.image_url)
    : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=80'];

  const discount = product.old_price 
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize && product.available_sizes && product.available_sizes.length > 0) {
      toast.error("Пожалуйста, выберите размер");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize || 'ONE SIZE',
      color: product.available_colors?.[selectedColor] || 'default',
      image: mainImages[0],
    });
    toast.success("Товар добавлен в корзину");
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left side - Product images */}
      <div className="flex-1 flex items-center justify-center py-8 lg:py-16 px-4 lg:px-8 relative">
        {/* Left arrow - outside image */}
        {mainImages.length > 1 && (
          <button 
            onClick={() => setCurrentImage((prev) => (prev - 1 + mainImages.length) % mainImages.length)}
            className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 hover:opacity-60 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
          </button>
        )}

        {/* Image container */}
        <div className="max-w-xl w-full">
          <img
            src={mainImages[currentImage]}
            alt={product.name}
            className="w-full"
          />

          {/* Color dots below image */}
          {mainImages.length > 1 && (
            <div className="flex gap-2 justify-center mt-4 lg:mt-6">
              {mainImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentImage ? "bg-primary w-8" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right arrow - outside image */}
        {mainImages.length > 1 && (
          <button 
            onClick={() => setCurrentImage((prev) => (prev + 1) % mainImages.length)}
            className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 hover:opacity-60 transition-opacity"
          >
            <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
          </button>
        )}
      </div>

      {/* Right side - Product info */}
      <div className="w-full lg:w-[480px] border-t lg:border-t-0 lg:border-l border-border py-8 lg:py-16 px-6 lg:px-12 overflow-y-auto">
        {/* Title and discount badge */}
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-sm tracking-[0.15em] uppercase font-light flex-1">
            {product.name}
          </h1>
          {product.is_sale && discount > 0 && (
            <div className="bg-black text-white w-14 h-14 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ml-4">
              {discount}%
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-8">
          {product.old_price && (
            <span className="text-base text-muted-foreground line-through">
              {product.old_price} ₽
            </span>
          )}
          <span className="text-xl font-medium">
            {product.price} ₽
          </span>
        </div>

        {/* Article */}
        {product.article && (
          <div className="mb-6 text-sm text-muted-foreground">
            Артикул: {product.article}
          </div>
        )}

        {/* Color and Material */}
        {(product.available_colors?.[selectedColor] || product.material) && (
          <div className="space-y-1 mb-6 text-sm">
            {product.available_colors?.[selectedColor] && (
              <div>Цвет: {product.available_colors[selectedColor]}</div>
            )}
            {product.material && (
              <div>Состав: {product.material}</div>
            )}
          </div>
        )}

        {/* Size selection */}
        {product.available_sizes && product.available_sizes.length > 0 && (
          <div className="mb-4">
            <div className="text-sm mb-3">Размер:</div>
            <div className="flex gap-2 mb-3">
              {product.available_sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border text-sm transition-colors ${
                    selectedSize === size 
                      ? "border-foreground bg-foreground text-background" 
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <Link 
              to="/info?section=size-guide" 
              className="text-xs underline hover:no-underline inline-block"
            >
              Информация о размерах товара
            </Link>
          </div>
        )}

        {/* Add to cart button and favorite */}
        <div className="flex gap-3 my-8">
          <button 
            onClick={handleAddToCart}
            className="flex-1 bg-foreground text-background py-3.5 px-6 text-xs tracking-[0.1em] uppercase hover:opacity-90 transition-opacity"
          >
            ДОБАВИТЬ В КОРЗИНУ
          </button>
          <button className="w-12 h-12 border border-border hover:border-foreground transition-colors flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Other colors */}
        {product.available_colors && product.available_colors.length > 1 && (
          <div className="text-sm mb-8">
            В другом цвете:{" "}
            <Link to="#" className="underline hover:no-underline">
              {product.available_colors.filter((_, idx) => idx !== selectedColor)[0]}
            </Link>
          </div>
        )}

        {/* Delivery section */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm font-medium mb-2 tracking-wide">ДОСТАВКА</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-1">
            Доставка по России за 1-7 дней, бесплатно
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-1">
            По Санкт-Петербургу и Москве доставка заказа возможна доставка на следующий день. 
            Стоимость доставки от 1500 руб.
          </p>
          <Link 
            to="/info?section=delivery" 
            className="text-sm underline hover:no-underline inline-block"
          >
            Подробнее на странице Доставка
          </Link>
        </div>

        {/* Payment section */}
        <div className="pt-6">
          <h3 className="text-sm font-medium mb-2 tracking-wide">ОПЛАТА</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-1">
            Онлайн оплата через платежную систему CloudPayments
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-1">
            Принимаются карты VISA, MasterCard, платежная система «Мир»
          </p>
          <Link 
            to="/info?section=delivery" 
            className="text-sm underline hover:no-underline inline-block"
          >
            Подробнее на странице Оплата
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Product;
