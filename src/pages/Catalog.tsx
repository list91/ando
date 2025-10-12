import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useToast } from "@/hooks/use-toast";

interface CatalogProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const Catalog = ({ selectedCategory, setSelectedCategory }: CatalogProps) => {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});
  const [fadeIn, setFadeIn] = useState(false);
  const { data: products, isLoading } = useProducts();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();

  useEffect(() => {
    // Trigger fade-in animation on mount
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Reset hoveredProduct when the category changes
    setHoveredProduct(null);
    // Reset image indices when the category changes
    setImageIndices({});
  }, [selectedCategory]);

  const filteredProducts = products;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-700 ease-out ${
      fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Category Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide">{selectedCategory}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredProducts?.length || 0} {filteredProducts?.length === 1 ? 'товар' : 'товаров'}
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const images = product.product_images?.sort((a, b) => a.display_order - b.display_order) || [];
              const mainImages = images.length > 0 
                ? images.map(img => img.image_url)
                : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80'];
              
              const currentIndex = imageIndices[product.id] || 0;
              const currentImage = mainImages[currentIndex] || mainImages[0];

              const discount = product.old_price 
                ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
                : 0;

              const getColorClass = (color: string) => {
                const colorLower = color.toLowerCase();
                if (colorLower === 'белый') return 'bg-white';
                if (colorLower === 'черный') return 'bg-black';
                if (colorLower === 'серый') return 'bg-gray-400';
                if (colorLower === 'бежевый') return 'bg-[#F5F5DC]';
                if (colorLower === 'коричневый') return 'bg-[#8B4513]';
                if (colorLower === 'синий') return 'bg-blue-600';
                if (colorLower === 'красный') return 'bg-red-600';
                if (colorLower === 'зеленый') return 'bg-green-600';
                if (colorLower === 'розовый') return 'bg-pink-400';
                return 'bg-muted';
              };

              const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
                if (images.length <= 1) return;
                
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const sectionWidth = rect.width / images.length;
                const newIndex = Math.floor(x / sectionWidth);
                
                if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
                  setImageIndices(prev => ({
                    ...prev,
                    [product.id]: newIndex
                  }));
                }
              };

              const handleMouseEnter = () => {
                setHoveredProduct(product.id);
              };

              const handleMouseLeave = () => {
                setHoveredProduct(null);
                setImageIndices(prev => ({
                  ...prev,
                  [product.id]: 0
                }));
              };

              const handleFavoriteClick = async (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                
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
                      className="relative aspect-[3/4] mb-3 overflow-hidden bg-muted"
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {product.is_sale && discount > 0 && (
                        <div className="absolute bottom-4 left-4 z-10 bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center text-xs font-normal">
                          {discount}%
                        </div>
                      )}
                      <img
                        src={currentImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Image indicators */}
                      {images.length > 1 && hoveredProduct === product.id && (
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

                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFavoriteClick(e);
                    }}
                    className="absolute top-3 right-3 z-20 hover:scale-110 transition-transform"
                    aria-label={isFavorite(product.id) ? "Удалить из избранного" : "Добавить в избранное"}
                  >
                    <Heart 
                      className={`h-6 w-6 transition-all ${
                        isFavorite(product.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-white stroke-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                      }`}
                    />
                  </button>

                  <Link to={`/product/${product.slug}`}>
                    <h3 className="text-sm mb-2 tracking-wide text-foreground">{product.name}</h3>
                    
                    <div className="flex items-center gap-3 mb-2">
                      {product.old_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.old_price} ₽
                        </span>
                      )}
                      <span className="font-medium">
                        {product.price} ₽
                      </span>
                    </div>

                    {product.available_colors && product.available_colors.length > 0 && (
                      <div className="flex gap-1.5">
                        {product.available_colors.slice(0, 5).map((color, idx) => (
                          <div
                            key={idx}
                            className={`w-5 h-5 rounded-full border border-border ${getColorClass(color)}`}
                          />
                         ))}
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Товары не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;
