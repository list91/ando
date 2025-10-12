import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";

interface CatalogProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const Catalog = ({ selectedCategory, setSelectedCategory }: CatalogProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSaleFilter, setIsSaleFilter] = useState(false);
  
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts(
    selectedCategoryId,
    isSaleFilter
  );

  useEffect(() => {
    if (selectedCategory === "Все товары") {
      setSelectedCategoryId(null);
      setIsSaleFilter(false);
    } else if (selectedCategory === "SALE %") {
      setSelectedCategoryId(null);
      setIsSaleFilter(true);
    } else {
      const category = categories.find((cat) => cat.name === selectedCategory);
      setSelectedCategoryId(category?.id || null);
      setIsSaleFilter(false);
    }
  }, [selectedCategory, categories]);


  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка товаров...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Filters - Responsive */}
      <div className="border-b border-border py-4 px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-sm">
          <div className="flex flex-wrap gap-4 lg:gap-8">
            <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
              Материал <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
              Цвет <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
              Размер <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 hover:opacity-60 transition-opacity">
              Цена <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="text-muted-foreground text-xs lg:text-sm">
            Сортировать по: Цена по возрастанию
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="p-8 lg:p-16 text-center">
          <p className="text-muted-foreground">Товары не найдены</p>
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
                <div className="relative aspect-[3/4] mb-4 overflow-hidden">
                  {product.is_sale && discount > 0 && (
                    <div className="absolute top-4 right-4 z-10 bg-black text-white w-12 h-12 rounded-full flex items-center justify-center text-xs">
                      -{discount}%
                    </div>
                  )}
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                <h3 className="text-sm mb-2 tracking-wide">{product.name}</h3>
                
                {product.available_colors && product.available_colors.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    {product.available_colors.slice(0, 4).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  {product.old_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.old_price} ₽
                    </span>
                  )}
                  <span className="text-sm font-medium">
                    {product.price} ₽
                  </span>
                </div>

                {product.available_sizes && product.available_sizes.length > 0 && (
                  <div className="flex gap-2 text-xs">
                    {product.available_sizes.map((size) => (
                      <span key={size} className="text-muted-foreground">
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
