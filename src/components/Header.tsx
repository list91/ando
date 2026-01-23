import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ShoppingCart, Heart, User, LogOut, Menu as MenuIcon, ShieldCheck, Package, Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ProductSearch from "./ProductSearch";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalogSearch } from "@/contexts/CatalogSearchContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const { query: searchQuery, setQuery: setSearchQuery, clearQuery: clearSearchQuery } = useCatalogSearch();
  const {
    totalItems
  } = useCart();
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentGender = searchParams.get('gender') || 'women';
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const {
        data
      } = await supabase.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin', 'manager']);
      setIsAdmin(data && data.length > 0);
    };
    if (user) {
      setTimeout(() => {
        checkAdminRole();
      }, 0);
    }
  }, [user]);
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return <>
      <header className="sticky top-0 z-50 bg-background border-b border-border hidden md:block">
        <div className="h-40 px-4 lg:px-8">
          <div className="hidden lg:grid lg:grid-cols-[auto_1fr] items-center h-full gap-12">
            {/* Desktop Navigation - left */}
            <nav className="flex items-center gap-2 justify-start" role="navigation" aria-label="Основная навигация">
              <Link to="/catalog?gender=women" className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-all px-6 py-6 whitespace-nowrap ${(location.pathname === '/catalog' || location.pathname.startsWith('/product/')) && currentGender === 'women' ? 'bg-secondary' : ''}`}>
                ЖЕНСКОЕ
              </Link>
              <Link to="/catalog?gender=men" className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-all px-6 py-6 whitespace-nowrap ${(location.pathname === '/catalog' || location.pathname.startsWith('/product/')) && currentGender === 'men' ? 'bg-secondary' : ''}`}>
                МУЖСКОЕ
              </Link>
              <Link to="/lookbook" className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-all px-6 py-6 whitespace-nowrap ${location.pathname === '/lookbook' ? 'bg-secondary' : ''}`}>
                LOOKBOOK
              </Link>
              <Link to="/info" className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-all px-6 py-6 whitespace-nowrap ${location.pathname === '/info' ? 'bg-secondary' : ''}`}>
                INFO +
              </Link>
            </nav>

            {/* Search + Right Icons - fixed together on right */}
            <div className="flex items-center gap-6 justify-end">
            {/* Search */}
            <div className="w-[280px]">
              <ProductSearch />
            </div>
            {/* Cart */}
            <button onClick={() => setIsCartOpen(true)} className="hover:opacity-60 transition-opacity relative min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Корзина">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-foreground text-background text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>}
            </button>

            {/* Favorites - hidden on small mobile */}
            <Link to="/favorites" className="hidden sm:block hover:opacity-60 transition-opacity">
              <Heart className="w-5 h-5" />
            </Link>
            
            {/* User Menu */}
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px]">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuLabel>
                    <User className="w-4 h-4 inline mr-2" />
                    Мой аккаунт
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Админ-панель
                    </DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="w-4 h-4 mr-2" />
                    Избранное
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <Package className="w-4 h-4 mr-2" />
                    Мои заказы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className="hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px]">
                <User className="w-5 h-5" />
              </Button>}
            </div>
          </div>

          {/* Mobile Layout - Hidden on mobile, MobileBottomNav is used instead */}
          <div className="hidden md:flex lg:hidden items-center justify-between h-full">
            {/* Mobile Menu Button */}
            <button className="hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Меню">
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Mobile Search Bar - expandable */}
            {isMobileSearchOpen && (
              <div className="absolute left-0 right-0 top-0 h-full bg-background z-10 flex items-center px-4 gap-2">
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      if (searchQuery) {
                        clearSearchQuery();
                      } else {
                        setIsMobileSearchOpen(false);
                      }
                    } else if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate('/catalog');
                      setIsMobileSearchOpen(false);
                    }
                  }}
                  className="flex-1 bg-transparent border-0 border-b border-border px-2 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (searchQuery) {
                      clearSearchQuery();
                      mobileSearchInputRef.current?.focus();
                    } else {
                      setIsMobileSearchOpen(false);
                    }
                  }}
                  className="hover:opacity-60 transition-opacity p-2"
                  aria-label={searchQuery ? "Очистить поиск" : "Закрыть поиск"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Mobile Right Icons */}
            <div className="flex items-center gap-3">
              {/* Search Icon */}
              <button
                onClick={() => {
                  setIsMobileSearchOpen(true);
                  setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
                }}
                className="hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Поиск"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <button onClick={() => setIsCartOpen(true)} className="hover:opacity-60 transition-opacity relative min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Корзина">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-foreground text-background text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>}
              </button>

              {/* Favorites - hidden on small mobile */}
              <Link to="/favorites" className="hidden sm:flex hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px] items-center justify-center" aria-label="Избранное">
                <Heart className="w-5 h-5" />
              </Link>

              {/* User Menu */}
              {user ? <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px]">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background z-50">
                    <DropdownMenuLabel>
                      <User className="w-4 h-4 inline mr-2" />
                      Мой аккаунт
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Админ-панель
                      </DropdownMenuItem>}
                    <DropdownMenuItem onClick={() => navigate('/favorites')}>
                      <Heart className="w-4 h-4 mr-2" />
                      Избранное
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <Package className="w-4 h-4 mr-2" />
                      Мои заказы
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> : <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className="hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px]">
                  <User className="w-5 h-5" />
                </Button>}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && <div className="hidden md:block lg:hidden border-t border-border bg-background">
            <nav className="flex flex-col py-4" role="navigation" aria-label="Мобильная навигация">
              <Link to="/catalog?gender=women" className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                ЖЕНСКОЕ
              </Link>
              <Link to="/catalog?gender=men" className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                МУЖСКОЕ
              </Link>
              <Link to="/lookbook" className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                LOOKBOOK
              </Link>
              <Link to="/info" className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                INFO +
              </Link>
            </nav>
          </div>}
      </header>
    
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>;
};
export default Header;