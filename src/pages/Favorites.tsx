import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading: favoritesLoading, toggleFavorite } = useFavorites();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Если не авторизован - показываем предложение войти
  if (!authLoading && !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-semibold mb-2">Избранное</h1>
          <p className="text-muted-foreground mb-6">
            Войдите в аккаунт, чтобы сохранять понравившиеся товары
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/auth')}>
              Войти
            </Button>
            <Button variant="outline" onClick={() => navigate('/catalog')}>
              В каталог
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || favoritesLoading || productsLoading) {
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
    <div className="min-h-[60vh] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Избранное</h1>
          <p className="text-muted-foreground">
            {favoriteProducts && favoriteProducts.length > 0
              ? `${favoriteProducts.length} ${favoriteProducts.length === 1 ? 'товар' : 'товара'}`
              : 'Пока нет избранных товаров'}
          </p>
        </div>

        {!favoriteProducts || favoriteProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Ваш список избранного пуст</h2>
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
                        <div className="absolute top-4 left-4 z-10 bg-black text-white px-3 py-1 text-xs font-normal uppercase tracking-wider rounded-full">
                          NEW
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
                        <div className="absolute top-3 left-3 bg-[#C6121F] text-white px-2 py-1 text-xs font-medium rounded-full">
                          SALE
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
