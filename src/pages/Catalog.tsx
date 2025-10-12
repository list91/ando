import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { useProducts, useCategories, useProductFilters, ProductFilters } from "@/hooks/useProducts";
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
  
  const { data: categories = [] } = useCategories();
  const { data: filterOptions } = useProductFilters();
  const { data: products = [], isLoading } = useProducts(filters);

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

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка товаров...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Filters */}
      <div className="border-b border-border py-4 px-4 lg:px-8">
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
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: color }}
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

          <div className="text-muted-foreground text-xs lg:text-sm">
            Найдено товаров: {products.length}
          </div>
        </div>
      </div>

      {products.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 p-4 lg:p-8">
          {products.map((product) => {
            const mainImage = product.product_images?.[0]?.image_url || 
              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80';
            
            const discount = product.old_price 
              ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
              : 0;

            return (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group"
              >
                <div className="relative aspect-[3/4] mb-3 overflow-hidden bg-muted">
                  {product.is_sale && discount > 0 && (
                    <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center text-xs font-normal">
                      {discount}%
                    </div>
                  )}
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                <h3 className="text-sm mb-2 tracking-wide text-foreground">{product.name}</h3>
                
                <div className="flex items-center gap-2 mb-2">
                  {product.old_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.old_price} ₽
                    </span>
                  )}
                  <span className="text-sm text-foreground">
                    {product.price} ₽
                  </span>
                  {product.available_colors && product.available_colors.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      {product.available_colors.slice(0, 4).map((color, idx) => (
                        <div
                          key={idx}
                          className="w-3 h-3 rounded-full border border-border/50"
                          style={{ backgroundColor: color }}
                        />
                      ))}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Catalog;
