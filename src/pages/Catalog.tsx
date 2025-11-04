import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, X, Heart } from "lucide-react";
import { useProducts, useCategories, useProductFilters, ProductFilters } from "@/hooks/useProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface CatalogProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const Catalog = ({ selectedCategory, setSelectedCategory }: CatalogProps) => {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<string>('default');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchProductId, setTouchProductId] = useState<string | null>(null);
  const mouseXRef = useRef<number>(0);
  
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

  const getColorHex = (colorName: string): string => {
    const lowerName = colorName.toLowerCase().trim();
    return colorMap[lowerName] || '#CCCCCC'; // Default gray if color not found
  };

  useEffect(() => {
    const newFilters: ProductFilters = {};
    
    if (selectedCategory === "Все товары") {
      newFilters.categoryId = null;
      newFilters.isSale = false;
    } else if (selectedCategory === "SALE %") {
      newFilters.categoryId = null;
      newFilters.isSale = true;
    } else {
      const category = categories.find((cat) => cat.name === selectedCategory);
      newFilters.categoryId = category?.id || null;
      newFilters.isSale = false;
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

    if (priceRange.min !== undefined) {
      newFilters.minPrice = priceRange.min;
    }

    if (priceRange.max !== undefined) {
      newFilters.maxPrice = priceRange.max;
    }

    setFilters(newFilters);
  }, [selectedCategory, categories, selectedMaterials, selectedColors, selectedSizes, priceRange]);

  const clearFilters = () => {
    setSelectedMaterials([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange({});
  };

  const hasActiveFilters = selectedMaterials.length > 0 || selectedColors.length > 0 || 
    selectedSizes.length > 0 || priceRange.min !== undefined || priceRange.max !== undefined;

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
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
      <section className="border-b border-border py-4 px-4 lg:pl-8" aria-label="Фильтры товаров">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-sm">
          <div className="flex flex-wrap gap-4 lg:gap-8 items-center">
            {/* Material Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
                  Материал {selectedMaterials.length > 0 && `(${selectedMaterials.length})`}
                  <ChevronDown className="w-4 h-4" />
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
                <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
                  Цвет {selectedColors.length > 0 && `(${selectedColors.length})`}
                  <ChevronDown className="w-4 h-4" />
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
                <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
                  Размер {selectedSizes.length > 0 && `(${selectedSizes.length})`}
                  <ChevronDown className="w-4 h-4" />
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

            {/* Price Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
                  Цена {(priceRange.min || priceRange.max) && '•'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-4">
                  <p className="font-medium text-sm">Диапазон цен</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="От"
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                      value={priceRange.min || ''}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value ? Number(e.target.value) : undefined })}
                    />
                    <span className="text-muted-foreground">—</span>
                    <input
                      type="number"
                      placeholder="До"
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                      value={priceRange.max || ''}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  {filterOptions?.priceRange && (
                    <p className="text-xs text-muted-foreground">
                      Цены: {filterOptions.priceRange.min} — {filterOptions.priceRange.max} ₽
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

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

          {/* Sorting */}
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-xs lg:text-sm">
              Найдено: {products.length}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-60 transition-opacity text-xs lg:text-sm">
                  Сортировка
                  <ChevronDown className="w-4 h-4" />
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
        </div>
      </section>

      {sortedProducts.length === 0 ? (
        <div className="p-8 lg:p-16 text-center">
          <p className="text-muted-foreground">Товары не найдены</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm underline hover:no-underline"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 p-4 lg:pl-8 lg:pr-8" aria-label="Список товаров">
          {sortedProducts.map((product) => {
            const images = product.product_images && product.product_images.length > 0
              ? product.product_images.map(img => img.image_url)
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
              
              if (Math.abs(delta) > 50) { // Threshold for swipe
                if (delta > 0) {
                  // Moving right - next image
                  setCurrentImageIndexes(prev => ({
                    ...prev,
                    [product.id]: Math.min((prev[product.id] || 0) + 1, images.length - 1)
                  }));
                } else {
                  // Moving left - previous image
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
                  // Swiped left - next image
                  setCurrentImageIndexes(prev => ({
                    ...prev,
                    [product.id]: Math.min((prev[product.id] || 0) + 1, images.length - 1)
                  }));
                } else {
                  // Swiped right - previous image
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

            return (
              <div key={product.id} className="group relative">
                <Link to={`/product/${product.slug}`}>
                  <div 
                    className="relative aspect-[3/4] mb-3 overflow-hidden bg-muted"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* NEW badge - top left */}
                    {product.is_new && (
                      <div className="absolute top-4 left-4 z-10 bg-foreground text-background px-3 py-1 text-xs font-normal uppercase tracking-wider border border-foreground">
                        NEW
                      </div>
                    )}
                    
                    {/* Sale badge - bottom left */}
                    {product.is_sale && discount > 0 && (
                      <div className="absolute bottom-4 left-4 z-10 bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center text-xs font-normal">
                        {discount}%
                      </div>
                    )}
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Image indicators - show on hover or touch */}
                    {images.length > 1 && (hoveredProduct === product.id || touchProductId === product.id) && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, idx) => (
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

                <Link to={`/product/${product.slug}`}>
                  <h3 className="text-sm mb-2 tracking-wide text-foreground">{product.name}</h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-foreground">
                      {product.price} ₽
                    </span>
                    {product.old_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {product.old_price} ₽
                      </span>
                    )}
                    {product.available_colors && product.available_colors.length > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        {product.available_colors.slice(0, 4).map((color, idx) => {
                          const colorHex = getColorHex(color);
                          return (
                            <div
                              key={idx}
                              className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0"
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
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {product.available_sizes.map((size) => (
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
      )}
    </main>
  );
};

export default Catalog;
