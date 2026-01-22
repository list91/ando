import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useProduct } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SchemaOrg from "@/components/SchemaOrg";
import { Helmet } from "react-helmet-async";

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { data: product, isLoading } = useProduct(id || '');
  
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);

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
  };

const goToImage = (index: number) => {    setCurrentImage(index);    zoomRef.current?.resetTransform();  };  const goToPrevImage = () => {    goToImage((currentImage - 1 + mainImages.length) % mainImages.length);  };  const goToNextImage = () => {    goToImage((currentImage + 1) % mainImages.length);  };
  return (
    <>
      <Helmet>
        <title>{product.name} — ANDO JV</title>
        <meta name="description" content={product.description || `${product.name} от ANDO JV. Российский бренд современной минималистичной одежды.`} />
        <meta property="og:title" content={`${product.name} — ANDO JV`} />
        <meta property="og:description" content={product.description || `${product.name} от ANDO JV`} />
        <meta property="og:image" content={mainImages[0]} />
        <meta property="og:type" content="product" />
      </Helmet>
      
      <SchemaOrg type="product" data={product} />
      
      <div className="flex flex-col lg:flex-row min-h-full">
        {/* Left side - Product images */}
        <div className="flex-1 flex items-center justify-center py-6 lg:py-16 px-12 lg:px-16 relative">

        {/* Left arrow - outside image */}
        {mainImages.length > 1 && (
          <button 
            onClick={() => setCurrentImage((prev) => (prev - 1 + mainImages.length) % mainImages.length)}
            className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 hover:opacity-60 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-2"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        )}

        {/* Right arrow - outside image */}
        {mainImages.length > 1 && (
          <button 
            onClick={() => setCurrentImage((prev) => (prev + 1) % mainImages.length)}
            className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 hover:opacity-60 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-2"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        )}
      </div>

      {/* Right side - Product info */}
      <div className="w-full lg:w-[480px] border-t lg:border-t-0 lg:border-l border-border py-6 lg:py-16 px-6 lg:px-12 lg:overflow-y-auto">{" "}
        {/* Title and discount badge */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-sm tracking-[0.15em] uppercase font-light">
            {product.name}
          </h1>
          {product.is_sale && discount > 0 && (
            <div className="bg-[#C6121F] text-white px-4 py-1.5 text-xs font-medium rounded-full ml-[40px]">
              −{discount}%
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

        {/* Color and Composition */}
        {(product.available_colors?.length > 0 || product.composition || product.material) && (
          <div className="space-y-1 mb-6 text-sm">
            {product.available_colors?.length > 0 && (
              <div>Цвет: {product.available_colors.join(', ')}</div>
            )}
            {(product.composition || product.material) && (
              <div>Состав: {product.composition || product.material}</div>
            )}
          </div>
        )}

        {/* Size selection */}
        {product.available_sizes && product.available_sizes.length > 0 && (
          <div className="mb-4">
            <div className="text-sm mb-3">Размер:</div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {product.available_sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 rounded-full border text-sm transition-all ${
                    selectedSize === size 
                      ? "border-foreground bg-foreground text-background scale-110" 
                      : "border-border hover:border-foreground hover:scale-105"
                  }`}
                  aria-label={`Выбрать размер ${size}`}
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
          <button 
            onClick={() => toggleFavorite(product.id)}
            className="w-12 h-12 flex items-center justify-center flex-shrink-0 hover:opacity-60 transition-opacity"
            aria-label={isFavorite(product.id) ? "Удалить из избранного" : "Добавить в избранное"}
          >
            <Heart className={`w-6 h-6 transition-all ${
              isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'stroke-2'
            }`} />
          </button>
        </div>

        {/* Other colors - ссылки на товары в других цветах */}
        {product.color_links && Object.keys(product.color_links).length > 0 && (
          <div className="text-sm mb-8">
            В другом цвете:{" "}
            {Object.entries(product.color_links)
              .map(([colorName, colorLink], index, array) => (
                <span key={colorName}>
                  {colorLink && colorLink.trim() !== '' ? (
                    <Link to={colorLink} className="underline hover:no-underline">
                      {colorName}
                    </Link>
                  ) : (
                    <span>{colorName}</span>
                  )}
                  {index < array.length - 1 && ", "}
                </span>
              ))}
          </div>
        )}

        {/* Delivery section */}
        <Collapsible open={isDeliveryOpen} onOpenChange={setIsDeliveryOpen} className="pt-6 border-t border-border">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left group">
            <h3 className="text-sm font-medium tracking-wide">ДОСТАВКА</h3>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDeliveryOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              Доставка по России за 1-7 дней, бесплатно
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              По Санкт-Петербургу и Москве доставка заказа возможна на следующий день. 
              Стоимость доставки от 1500 руб.
            </p>
            <Link 
              to="/info?section=delivery" 
              className="text-sm underline hover:no-underline inline-block mt-2"
            >
              Подробнее на странице Оплата и доставка
            </Link>
          </CollapsibleContent>
        </Collapsible>

        {/* Payment section */}
        <Collapsible open={isPaymentOpen} onOpenChange={setIsPaymentOpen} className="pt-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left group">
            <h3 className="text-sm font-medium tracking-wide">ОПЛАТА</h3>
            <ChevronDown className={`w-4 h-4 transition-transform ${isPaymentOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              Онлайн оплата через платежную систему CloudPayments
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              Принимаются карты VISA, MasterCard, платежная система «Мир»
            </p>
            <Link 
              to="/info?section=delivery" 
              className="text-sm underline hover:no-underline inline-block mt-2"
            >
              Подробнее на странице Оплата и доставка
            </Link>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
    </>
  );
};

export default Product;
