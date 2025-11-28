import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, X, Heart, Grid3x3, LayoutGrid } from "lucide-react";
import { useProducts, useCategories, useProductFilters, ProductFilters } from "@/hooks/useProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalogSearch } from "@/contexts/CatalogSearchContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { usePriceFilterStore } from "@/stores/priceFilterStore";


interface CatalogProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

// Полностью изолированный компонент фильтра цен
// Использует Zustand store - обновляет товары при каждом вводе
interface PriceFilterPopoverProps {
  priceRangeInfo?: { min: number; max: number };
}

const PriceFilterPopover = memo(({ priceRangeInfo }: PriceFilterPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Локальное состояние для инпутов - НЕ вызывает перерендер родителя
  const [localMin, setLocalMin] = useState(() => usePriceFilterStore.getState().min);
  const [localMax, setLocalMax] = useState(() => usePriceFilterStore.getState().max);
  const hasValue = localMin !== '' || localMax !== '';

  // Обновляем store при каждом изменении
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setLocalMin(value);
    usePriceFilterStore.getState().setMin(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setLocalMax(value);
    usePriceFilterStore.getState().setMax(value);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 hover:opacity-60 transition-opacity min-h-[44px] px-2 lg:px-3 text-xs lg:text-sm">
          Цена {hasValue && '•'}
          <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <p className="font-medium text-sm">Диапазон цен</p>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="От"
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
              value={localMin}
              onChange={handleMinChange}
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="До"
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
              value={localMax}
              onChange={handleMaxChange}
            />
          </div>
          {priceRangeInfo && (
            <p className="text-xs text-muted-foreground">
              Цены: {priceRangeInfo.min} — {priceRangeInfo.max} ₽
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

// Мемоизированная сетка товаров - перерендерится только при изменении products/gridCols
interface ProductGridProps {
  products: any[];
  gridCols: 3 | 4;
  getColorHex: (color: string) => string;
  user: any;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  navigate: (path: string, options?: any) => void;
  toast: (options: any) => void;
}

const ProductGrid = memo(({ products, gridCols, getColorHex, user, isFavorite, toggleFavorite, navigate, toast }: ProductGridProps) => {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchProductId, setTouchProductId] = useState<string | null>(null);
  const mouseXRef = useRef<number>(0);

  return (
    <section
      className={`grid grid-cols-2 ${
        gridCols === 3 ? 'md:grid-cols-3 lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'
      } gap-2 sm:gap-3 lg:gap-6 p-2 sm:p-3 lg:px-8 lg:py-6`}
      aria-label="Список товаров"
    >
      {products.map((product) => {
        const images = product.product_images && product.product_images.length > 0
          ? product.product_images.map((img: any) => img.image_url)
          : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80'];

        const currentIndex = currentImageIndexes[product.id] || 0;
        const currentImage = images[currentIndex] || images[0];

        const discount = product.old_price
          ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
          : 0;

        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
          if (images.length <= 1) return;

          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const delta = x - mouseXRef.current;

          if (Math.abs(delta) > 50) {
            if (delta > 0) {
              setCurrentImageIndexes(prev => ({
                ...prev,
                [product.id]: Math.min((prev[product.id] || 0) + 1, images.length - 1)
              }));
            } else {
              setCurrentImageIndexes(prev => ({
                ...prev,
                [product.id]: Math.max((prev[product.id] || 0) - 1, 0)
              }));
            }
            mouseXRef.current = x;
          }
        };

        const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
          setHoveredProduct(product.id);
          const rect = e.currentTarget.getBoundingClientRect();
          mouseXRef.current = e.clientX - rect.left;
        };

        const handleMouseLeave = () => {
          setHoveredProduct(null);
          setCurrentImageIndexes(prev => ({
            ...prev,
            [product.id]: 0
          }));
        };

        const handleTouchStart = (e: React.TouchEvent) => {
          if (images.length <= 1) return;
          setTouchStart(e.touches[0].clientX);
          setTouchProductId(product.id);
          setHoveredProduct(product.id);
        };

        const handleTouchMove = (e: React.TouchEvent) => {
          if (!touchStart || touchProductId !== product.id || images.length <= 1) return;

          const touchEnd = e.touches[0].clientX;
          const diff = touchStart - touchEnd;

          if (Math.abs(diff) > 50) {
            if (diff > 0) {
              setCurrentImageIndexes(prev => ({
                ...prev,
                [product.id]: Math.min((prev[product.id] || 0) + 1, images.length - 1)
              }));
            } else {
              setCurrentImageIndexes(prev => ({
                ...prev,
                [product.id]: Math.max((prev[product.id] || 0) - 1, 0)
              }));
            }
            setTouchStart(touchEnd);
          }
        };

        const handleTouchEnd = () => {
          setTouchStart(null);
          setTouchProductId(null);
        };

        const handleFavoriteClick = async (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();

          if (!user) {
            toast({
              title: "Требуется авторизация",
              description: "Войдите в аккаунт, чтобы добавить товар в избранное",
            });
            navigate('/auth', { state: { from: '/catalog' } });
            return;
          }

          await toggleFavorite(product.id);
          toast({
            title: isFavorite(product.id) ? "Удалено из избранного" : "Добавлено в избранное",
            description: product.name,
          });
        };

        return (
          <div key={product.id} className="group relative">
            <Link to={`/product/${product.slug}`}>
              <div
                className="relative aspect-[3/4] mb-2 lg:mb-3 overflow-hidden bg-muted"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {product.is_new && (
                  <div className="absolute top-1.5 left-1.5 lg:top-2 lg:left-2 z-10 bg-background/95 backdrop-blur-sm text-foreground px-1.5 py-0.5 lg:px-2.5 lg:py-1 text-[9px] lg:text-[11px] font-medium uppercase tracking-widest border border-border">
                    NEW
                  </div>
                )}

                {product.is_sale && (
                  <div className={`absolute ${product.is_new ? 'top-8 lg:top-11' : 'top-1.5 lg:top-2'} left-1.5 lg:left-2 z-10 bg-primary/10 text-primary px-1.5 py-0.5 lg:px-2.5 lg:py-1 text-[9px] lg:text-[11px] font-medium uppercase tracking-widest border border-primary/20`}>
                    SALE {discount > 0 && `−${discount}%`}
                  </div>
                )}
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />

                {images.length > 1 && (hoveredProduct === product.id || touchProductId === product.id) && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_: any, idx: number) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentIndex
                            ? 'bg-white w-4'
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Link>

            <button
              onClick={handleFavoriteClick}
              className="absolute top-2 right-2 lg:top-3 lg:right-3 z-20 hover:scale-110 transition-transform"
              aria-label={isFavorite(product.id) ? "Удалить из избранного" : "Добавить в избранное"}
            >
              <Heart
                className={`h-5 w-5 lg:h-6 lg:w-6 transition-all ${
                  isFavorite(product.id)
                    ? 'fill-red-500 text-red-500'
                    : 'text-white stroke-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                }`}
              />
            </button>

            <Link to={`/product/${product.slug}`}>
              <h3 className="text-xs lg:text-sm mb-1.5 lg:mb-2 tracking-wide text-foreground line-clamp-2">{product.name}</h3>

              <div className="flex flex-col gap-1 lg:gap-1.5 mb-1.5 lg:mb-2">
                <div className="flex items-center gap-1.5 lg:gap-2">
                  <span className="text-xs lg:text-sm font-medium text-foreground">
                    {product.price} ₽
                  </span>
                  {product.old_price && (
                    <span className="text-xs lg:text-sm text-muted-foreground line-through">
                      {product.old_price} ₽
                    </span>
                  )}
                </div>
                {product.available_colors && product.available_colors.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {product.available_colors.slice(0, 4).map((color: string, idx: number) => {
                      const colorHex = getColorHex(color);
                      return (
                        <div
                          key={idx}
                          className="w-4 h-4 lg:w-5 lg:h-5 rounded-full border border-border flex-shrink-0"
                          style={{
                            backgroundColor: colorHex,
                            boxShadow: colorHex.toLowerCase() === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                          }}
                          title={color}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {product.available_sizes && product.available_sizes.length > 0 && (
                <div className="flex gap-2 lg:gap-3 text-[10px] lg:text-xs text-muted-foreground">
                  {product.available_sizes.map((size: string) => (
                    <span key={size}>
                      {size}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </div>
        );
      })}
    </section>
  );
});

// Обертка для ProductGrid - подписывается на store цен и фильтрует товары
interface ProductGridWrapperProps {
  products: any[];
  gridCols: 3 | 4;
  getColorHex: (color: string) => string;
  user: any;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  navigate: (path: string, options?: any) => void;
  toast: (options: any) => void;
  searchQuery: string;
  sortBy: string;
}

const ProductGridWrapper = memo(({
  products,
  gridCols,
  getColorHex,
  user,
  isFavorite,
  toggleFavorite,
  navigate,
  toast,
  searchQuery,
  sortBy
}: ProductGridWrapperProps) => {
  // Подписка на store цен - только этот компонент перерендерится при изменении цен
  const priceMin = usePriceFilterStore(state => state.min);
  const priceMax = usePriceFilterStore(state => state.max);

  // Фильтрация и сортировка товаров
  const filteredAndSortedProducts = useMemo(() => {
    // Сначала фильтруем по поиску
    let filtered = searchQuery
      ? products.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.article?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : products;

    // Затем фильтруем по цене
    const minPrice = priceMin ? Number(priceMin) : undefined;
    const maxPrice = priceMax ? Number(priceMax) : undefined;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filtered = filtered.filter(p => {
        if (minPrice !== undefined && p.price < minPrice) return false;
        if (maxPrice !== undefined && p.price > maxPrice) return false;
        return true;
      });
    }

    // Сортируем
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [products, searchQuery, priceMin, priceMax, sortBy]);

  if (filteredAndSortedProducts.length === 0) {
    return (
      <div className="p-8 lg:p-16 text-center">
        {searchQuery ? (
          <>
            <p className="text-muted-foreground mb-2">
              По запросу "<mark className="bg-yellow-200 px-1">{searchQuery}</mark>" ничего не найдено
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Попробуйте изменить запрос или очистить фильтры
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">Товары не найдены</p>
        )}
      </div>
    );
  }

  return (
    <ProductGrid
      products={filteredAndSortedProducts}
      gridCols={gridCols}
      getColorHex={getColorHex}
      user={user}
      isFavorite={isFavorite}
      toggleFavorite={toggleFavorite}
      navigate={navigate}
      toast={toast}
    />
  );
});

// Компонент для отображения количества найденных товаров - подписывается на store
interface ProductCountProps {
  products: any[];
  searchQuery: string;
}

const ProductCount = memo(({ products, searchQuery }: ProductCountProps) => {
  const priceMin = usePriceFilterStore(state => state.min);
  const priceMax = usePriceFilterStore(state => state.max);

  const count = useMemo(() => {
    let filtered = searchQuery
      ? products.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.article?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : products;

    const minPrice = priceMin ? Number(priceMin) : undefined;
    const maxPrice = priceMax ? Number(priceMax) : undefined;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filtered = filtered.filter(p => {
        if (minPrice !== undefined && p.price < minPrice) return false;
        if (maxPrice !== undefined && p.price > maxPrice) return false;
        return true;
      });
    }

    return filtered.length;
  }, [products, searchQuery, priceMin, priceMax]);

  return (
    <span className="text-muted-foreground text-xs lg:text-sm">
      Найдено: {count}
      {searchQuery && ` по запросу "${searchQuery}"`}
    </span>
  );
});

const Catalog = ({ selectedCategory, setSelectedCategory }: CatalogProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>({});
  const { query: searchQuery } = useCatalogSearch();
  const [gridCols, setGridCols] = useState<3 | 4>(3);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(
    searchParams.get("materials")?.split(",").filter(Boolean) || []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.get("colors")?.split(",").filter(Boolean) || []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.get("sizes")?.split(",").filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort") || "default");

  // Инициализация store из URL при первой загрузке
  useEffect(() => {
    const minFromUrl = searchParams.get("minPrice");
    const maxFromUrl = searchParams.get("maxPrice");
    if (minFromUrl) usePriceFilterStore.getState().setMin(minFromUrl);
    if (maxFromUrl) usePriceFilterStore.getState().setMax(maxFromUrl);
  }, []);
  
  const { data: categories = [] } = useCategories();
  const { data: filterOptions } = useProductFilters();
  const { data: products = [], isLoading } = useProducts(filters);
  const { data: settings } = useSiteSettings();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get color map from settings
  const colorMap = settings?.find(s => s.key === 'product_colors')?.value as Record<string, string> || {};

  const getColorHex = useCallback((colorName: string): string => {
    const lowerName = colorName.toLowerCase().trim();
    return colorMap[lowerName] || '#CCCCCC'; // Default gray if color not found
  }, [colorMap]);

  // Update URL params when filters change (NOT price - updated on popover close)
  useEffect(() => {
    setSearchParams(currentParams => {
      const params = new URLSearchParams();
      if (selectedMaterials.length > 0) params.set("materials", selectedMaterials.join(","));
      if (selectedColors.length > 0) params.set("colors", selectedColors.join(","));
      if (selectedSizes.length > 0) params.set("sizes", selectedSizes.join(","));
      // Price params сохраняем из текущих, обновляются при закрытии popover
      const currentMin = currentParams.get("minPrice");
      const currentMax = currentParams.get("maxPrice");
      if (currentMin) params.set("minPrice", currentMin);
      if (currentMax) params.set("maxPrice", currentMax);
      if (sortBy !== "default") params.set("sort", sortBy);

      // Keep search param from context
      const currentSearch = currentParams.get("search");
      if (currentSearch) params.set("search", currentSearch);

      return params;
    }, { replace: true });
  }, [selectedMaterials, selectedColors, selectedSizes, sortBy, setSearchParams]);

  useEffect(() => {
    const newFilters: ProductFilters = {};

    if (selectedCategory === "Все товары") {
      newFilters.categoryId = null;
      newFilters.isSale = false;
      newFilters.isNew = false;
    } else if (selectedCategory === "SALE" || selectedCategory === "SALE %") {
      newFilters.categoryId = null;
      newFilters.isSale = true;
      newFilters.isNew = false;
    } else if (selectedCategory === "NEW") {
      newFilters.categoryId = null;
      newFilters.isSale = false;
      newFilters.isNew = true;
    } else {
      const category = categories.find((cat) => cat.name === selectedCategory);
      newFilters.categoryId = category?.id || null;
      newFilters.isSale = false;
      newFilters.isNew = false;
    }

    if (selectedMaterials.length > 0) {
      newFilters.materials = selectedMaterials;
    }

    if (selectedColors.length > 0) {
      newFilters.colors = selectedColors;
    }

    if (selectedSizes.length > 0) {
      newFilters.sizes = selectedSizes;
    }

    // Цены НЕ добавляем в filters - фильтрация по цене делается в ProductGridWrapper через Zustand store

    // Only update if filters actually changed to prevent infinite loop
    setFilters(prevFilters => {
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        return prevFilters; // Return same reference to prevent re-render
      }
      return newFilters;
    });
  }, [selectedCategory, categories, selectedMaterials, selectedColors, selectedSizes]);

  const clearFilters = useCallback(() => {
    setSelectedMaterials([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    usePriceFilterStore.getState().reset();
    setSortBy("default");
  }, []);

  // Для отображения активных фильтров
  const hasActiveFilters = searchQuery || selectedMaterials.length > 0 || selectedColors.length > 0 ||
    selectedSizes.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка товаров...</p>
      </div>
    );
  }

  return (
    <main className="min-h-full" role="main">
      {/* Filters */}
      <section className="border-b border-border py-3 px-3 lg:px-8 lg:py-4" aria-label="Фильтры товаров">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 text-sm">
          <div className="flex flex-wrap gap-2 lg:gap-8 items-center">
            {/* Material Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 hover:opacity-60 transition-opacity min-h-[44px] px-2 lg:px-3 text-xs lg:text-sm">
                  Материал {selectedMaterials.length > 0 && `(${selectedMaterials.length})`}
                  <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-2">
                  <p className="font-medium mb-3 text-sm">Выберите материал</p>
                  {filterOptions?.materials.map((material) => (
                    <div key={material} className="flex items-center space-x-2">
                      <Checkbox
                        id={`material-${material}`}
                        checked={selectedMaterials.includes(material)}
                        onCheckedChange={(checked) => {
                          setSelectedMaterials(
                            checked
                              ? [...selectedMaterials, material]
                              : selectedMaterials.filter((m) => m !== material)
                          );
                        }}
                      />
                      <label
                        htmlFor={`material-${material}`}
                        className="text-sm cursor-pointer"
                      >
                        {material}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Color Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 hover:opacity-60 transition-opacity min-h-[44px] px-2 lg:px-3 text-xs lg:text-sm">
                  Цвет {selectedColors.length > 0 && `(${selectedColors.length})`}
                  <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-2">
                  <p className="font-medium mb-3 text-sm">Выберите цвет</p>
                  {filterOptions?.colors.map((color) => (
                    <div key={color} className="flex items-center space-x-2">
                      <Checkbox
                        id={`color-${color}`}
                        checked={selectedColors.includes(color)}
                        onCheckedChange={(checked) => {
                          setSelectedColors(
                            checked
                              ? [...selectedColors, color]
                              : selectedColors.filter((c) => c !== color)
                          );
                        }}
                      />
                      <label
                        htmlFor={`color-${color}`}
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        <div 
                          className="w-5 h-5 rounded-full border border-border flex-shrink-0"
                          style={{ backgroundColor: getColorHex(color) }}
                        />
                        {color}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Size Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 hover:opacity-60 transition-opacity min-h-[44px] px-2 lg:px-3 text-xs lg:text-sm">
                  Размер {selectedSizes.length > 0 && `(${selectedSizes.length})`}
                  <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-2">
                  <p className="font-medium mb-3 text-sm">Выберите размер</p>
                  <div className="grid grid-cols-3 gap-2">
                    {filterOptions?.sizes.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSizes.includes(size) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedSizes(
                            selectedSizes.includes(size)
                              ? selectedSizes.filter((s) => s !== size)
                              : [...selectedSizes, size]
                          );
                        }}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Price Filter - изолированный компонент, обновляет товары через Zustand при каждом вводе */}
            <PriceFilterPopover
              priceRangeInfo={filterOptions?.priceRange}
            />

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                Очистить фильтры
              </button>
            )}
          </div>

          {/* Sorting and Grid View */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4">
            {/* Mobile: Found count and Sorting */}
            <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto justify-between lg:justify-start order-1 lg:order-2">
              <ProductCount products={products} searchQuery={searchQuery} />
              
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 hover:opacity-60 transition-opacity text-xs lg:text-sm min-h-[44px] px-2 lg:px-3">
                    Сортировка
                    <ChevronDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-2">
                    <p className="font-medium mb-3 text-sm">Сортировать по</p>
                    {[
                      { value: 'default', label: 'По умолчанию' },
                      { value: 'price-asc', label: 'Цена: по возрастанию' },
                      { value: 'price-desc', label: 'Цена: по убыванию' },
                      { value: 'name-asc', label: 'Название: А-Я' },
                      { value: 'name-desc', label: 'Название: Я-А' },
                      { value: 'newest', label: 'Сначала новые' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          sortBy === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Desktop: Grid View Toggle - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-1 border border-border rounded-sm p-0.5 order-2 lg:order-1">
              <button
                onClick={() => setGridCols(3)}
                className={`p-1.5 transition-colors ${
                  gridCols === 3 ? 'bg-secondary' : 'hover:bg-secondary/50'
                }`}
                aria-label="3 карточки в строку"
                title="3 карточки"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-1.5 transition-colors ${
                  gridCols === 4 ? 'bg-secondary' : 'hover:bg-secondary/50'
                }`}
                aria-label="4 карточки в строку"
                title="4 карточки"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ProductGridWrapper подписывается на store цен и перерендеривается независимо от фильтров */}
      <ProductGridWrapper
        products={products}
        gridCols={gridCols}
        getColorHex={getColorHex}
        user={user}
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
        navigate={navigate}
        toast={toast}
        searchQuery={searchQuery}
        sortBy={sortBy}
      />
    </main>
  );
};

export default Catalog;
