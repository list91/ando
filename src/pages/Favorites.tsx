import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  available_colors: string[];
  product_images: {
    image_url: string;
    alt_text: string | null;
  }[];
}

export default function Favorites() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, removeFromFavorites, isLoading: favoritesLoading } = useFavorites();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      // Если пользователь не авторизован, перенаправляем на страницу авторизации
      navigate('/auth', { state: { from: '/favorites' } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && favorites.length > 0) {
      loadFavoriteProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [favorites, user]);

  const loadFavoriteProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          old_price,
          available_colors,
          product_images(image_url, alt_text)
        `)
        .in('id', favorites)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading favorite products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || favoritesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Редирект обрабатывается в useEffect
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Избранное</h1>
          <p className="text-muted-foreground">
            {products.length > 0
              ? `${products.length} ${products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}`
              : 'Пока нет избранных товаров'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Нет избранных товаров</h2>
            <p className="text-muted-foreground mb-8">
              Добавьте товары в избранное, чтобы они появились здесь
            </p>
            <Button asChild>
              <Link to="/catalog">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Перейти в каталог
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="group relative">
                <Link to={`/product/${product.slug}`} className="block">
                  <div className="aspect-[3/4] bg-secondary overflow-hidden rounded-lg mb-4">
                    {product.product_images && product.product_images.length > 0 ? (
                      <img
                        src={product.product_images[0].image_url}
                        alt={product.product_images[0].alt_text || product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-muted-foreground">Нет фото</span>
                      </div>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => removeFromFavorites(product.id)}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  aria-label="Удалить из избранного"
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </button>

                <div className="space-y-2">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-medium hover:underline">{product.name}</h3>
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    {product.old_price ? (
                      <>
                        <span className="text-lg font-semibold">{product.price.toLocaleString()} ₽</span>
                        <span className="text-sm text-muted-foreground line-through">
                          {product.old_price.toLocaleString()} ₽
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-semibold">{product.price.toLocaleString()} ₽</span>
                    )}
                  </div>

                  {product.available_colors && product.available_colors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {product.available_colors.length} {product.available_colors.length === 1 ? 'цвет' : 'цвета'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
