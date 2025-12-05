import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { data: product, isLoading } = useProduct(id || '');

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const zoomRef = useRef<ReactZoomPanPinchRef>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Swipe state test
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const swipeDirection = useRef<'horizontal' | 'vertical' | null>(null);
  const hasSwiped = useRef<boolean>(false);

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

  const goToImage = (index: number) => {
    setCurrentImage(index);
    zoomRef.current?.resetTransform();
    setIsZoomed(false);
  };

  // Получить индекс с учётом цикличности
  const getImageIndex = (index: number) => {
    return (index + mainImages.length) % mainImages.length;
  };

  // Touch handlers for swipe (only when not zoomed)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed || mainImages.length <= 1) return;

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeDirection.current = null;
    hasSwiped.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isZoomed || mainImages.length <= 1 || hasSwiped.current) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Определяем направление при первом движении (порог 8px)
    if (swipeDirection.current === null && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        swipeDirection.current = 'vertical';
        return;
      } else {
        swipeDirection.current = 'horizontal';
      }
    }

    if (swipeDirection.current === 'vertical') {
      return;
    }

    // Горизонтальный свайп — мгновенное переключение при достижении порога
    if (swipeDirection.current === 'horizontal') {
      e.preventDefault();
      const threshold = 50; // px для переключения

      if (deltaX < -threshold) {
        // Свайп влево — следующее фото
        setCurrentImage(getImageIndex(currentImage + 1));
        hasSwiped.current = true;
        touchStartX.current = e.touches[0].clientX; // Сброс для нового свайпа
      } else if (deltaX > threshold) {
        // Свайп вправо — предыдущее фото
        setCurrentImage(getImageIndex(currentImage - 1));
        hasSwiped.current = true;
        touchStartX.current = e.touches[0].clientX; // Сброс для нового свайпа
      }
    }
  };

  const handleTouchEnd = () => {
    swipeDirection.current = null;
    hasSwiped.current = false;
  };

  // Arrow navigation
  const goToPrevImage = () => {
    setCurrentImage(getImageIndex(currentImage - 1));
    zoomRef.current?.resetTransform();
    setIsZoomed(false);
  };

  const goToNextImage = () => {
    setCurrentImage(getImageIndex(currentImage + 1));
    zoomRef.current?.resetTransform();
    setIsZoomed(false);
  };

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
        <div className="flex-1 flex items-start justify-center py-6 lg:py-16 px-4 lg:px-16 relative">
          {/* Image container */}
          <div className="max-w-xl w-full relative">
            {/* Image with zoom */}
            <div
              className="relative overflow-hidden touch-pan-y aspect-[3/4]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* NEW badge - inside image container */}
              {product.is_new && (
                <div className="absolute top-3 left-[42px] z-20 bg-white text-black px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full">
                  NEW
                </div>
              )}

              {/* SALE badge - inside image container */}
              {product.is_sale && discount > 0 && (
                <div className={`absolute ${product.is_new ? 'top-12' : 'top-3'} left-[42px] z-20 bg-black text-white px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full`}>
                  SALE
                </div>
              )}

              <TransformWrapper
                key={currentImage}
                ref={zoomRef}
                initialScale={1}
                minScale={1}
                maxScale={3}
                doubleClick={{ mode: "toggle", step: 0.7 }}
                panning={{ disabled: !isZoomed }}
                pinch={{ step: 5 }}
                wheel={{ disabled: true }}
                onTransformed={(ref) => {
                  setIsZoomed(ref.state.scale > 1);
                }}
              >
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  <img
                    src={mainImages[currentImage]}
                    alt={product.name}
                    className="w-full h-full object-contain select-none"
                    loading="eager"
                    draggable={false}
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>

            {/* Navigation arrows - outside overflow-hidden for proper positioning */}
            {mainImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevImage}
                  className="absolute -left-[14px] md:-left-[30px] top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-background transition-colors z-10"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute -right-[14px] md:-right-[30px] top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-background transition-colors z-10"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots below image */}
            {mainImages.length > 1 && (
              <div className="flex gap-2 justify-center mt-4 lg:mt-6">
                {mainImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToImage(idx)}
                    className="p-1"
                    aria-label={`Фото ${idx + 1}`}
                  >
                    <span className={`block w-2 h-2 rounded-full transition-all ${
                      idx === currentImage ? "bg-foreground" : "bg-muted"
                    }`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Product info */}
        <div className="w-full lg:w-[480px] border-t lg:border-t-0 lg:border-l border-border py-6 lg:py-16 px-6 lg:px-12 lg:overflow-y-auto">
          {/* Title and discount badge */}
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-sm tracking-[0.15em] uppercase font-light flex-1">
              {product.name}
            </h1>
            {product.is_sale && discount > 0 && (
              <div className="bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-medium tabular-nums border border-primary/20 ml-3 flex-shrink-0">
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
