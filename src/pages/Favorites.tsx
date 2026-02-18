import { useFavorites } from '@/contexts/FavoritesContext';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

const Favorites = () => {
  // ЛК-3: Теперь гости тоже могут видеть избранное (из localStorage)
  const { favorites, isLoading: favoritesLoading, toggleFavorite } = useFavorites();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  if (favoritesLoading || productsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Получаем товары из избранного
  const favoriteProducts = products?.filter((product) =>
    favorites.includes(product.id)
  );

  return (
    <div className="min-h-[60vh] pt-2 pb-8 px-4 sm:px-6 lg:px-8 content-baseline">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-6 tracking-wide">Избранное</h1>
          <p className="text-muted-foreground">
            {favoriteProducts && favoriteProducts.length > 0
              ? `${favoriteProducts.length} ${favoriteProducts.length === 1 ? 'товар' : 'товара'}`
              : 'Пока нет избранных товаров'}
          </p>
        </div>

        {!favoriteProducts || favoriteProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-4">Ваш список избранного пуст</h2>
            <p className="text-muted-foreground mb-6">
              Добавляйте товары в избранное, нажимая на сердечко
            </p>
            <Button onClick={() => navigate('/catalog')}>
              Перейти в каталог
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => {
              const mainImage = product.product_images?.[0]?.image_url;

              return (
                <div key={product.id} className="group relative">
                  <Link to={`/product/${product.slug}`} className="block">
                    <div className="aspect-[3/4] overflow-hidden bg-muted mb-3 relative">
                      {/* NEW badge - top left */}
                      {product.is_new && (
                        <div className="absolute top-2 left-2 z-10 bg-black text-white px-1.5 py-0.5 text-[8px] font-normal uppercase tracking-wider rounded-full">
                          НОВОЕ
                        </div>
                      )}
                      
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                      {product.is_sale && (
                        <div className="absolute top-2 left-2 bg-[#C6121F] text-white w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded-full">
                          %
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="space-y-2">
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-medium hover:underline">{product.name}</h3>
                    </Link>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">
                        {product.price.toLocaleString('ru-RU')} ₽
                      </span>
                      {product.old_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.old_price.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (product.available_sizes && product.available_sizes.length > 0) {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: Number(product.price),
                              size: product.available_sizes[0],
                              color: product.available_colors?.[0] || '',
                              image: mainImage || '',
                            });
                          }
                        }}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        В корзину
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(product.id)}
                      >
                        <Heart className="h-5 w-5 fill-destructive text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
