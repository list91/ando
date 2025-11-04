import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Heart, User, LogOut, Menu as MenuIcon, ShieldCheck, Package, Search } from "lucide-react";
import { useState, useEffect } from "react";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    totalItems
  } = useCart();
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="h-40 px-4 lg:px-8">
          <div className="hidden lg:grid lg:grid-cols-[auto_1fr_auto] items-center h-full gap-12">
            {/* Desktop Navigation - left */}
            <nav className="flex items-center gap-2 justify-start" role="navigation" aria-label="Основная навигация">
              <Link to="/about" className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-all px-6 py-6 whitespace-nowrap ${location.pathname === '/about' ? 'bg-secondary' : ''}`}>
                О БРЕНДЕ
              </Link>
              <Link to="/catalog" className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-all px-6 py-6 whitespace-nowrap ${location.pathname === '/catalog' || location.pathname.startsWith('/product/') ? 'bg-secondary' : ''}`}>
                КАТАЛОГ
              </Link>
              <Link to="/lookbook" className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-all px-6 py-6 whitespace-nowrap ${location.pathname === '/lookbook' ? 'bg-secondary' : ''}`}>
                LOOKBOOK
              </Link>
              <Link to="/info" className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-all px-6 py-6 whitespace-nowrap ${location.pathname === '/info' ? 'bg-secondary' : ''}`}>
                INFO +
              </Link>
            </nav>

            {/* Spacer */}
            <div></div>

            {/* Right Icons */}
            <div className="flex items-center gap-6 justify-end">
            {/* Cart */}
            <button onClick={() => setIsCartOpen(true)} className="hover:opacity-60 transition-opacity relative" aria-label="Корзина">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-5 h-5 rounded-full flex items-center justify-center">
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
                  <Button variant="ghost" size="icon" className="hover:opacity-60 transition-opacity">
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
              </DropdownMenu> : <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className="hover:opacity-60 transition-opacity">
                <User className="w-5 h-5" />
              </Button>}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden flex items-center justify-between h-full">
            {/* Mobile Menu Button */}
            <button className="hover:opacity-60 transition-opacity" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Mobile Right Icons */}
            <div className="flex items-center gap-3">
              {/* Search Icon */}
              <button onClick={() => navigate('/catalog')} className="hover:opacity-60 transition-opacity" aria-label="Поиск">
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <button onClick={() => setIsCartOpen(true)} className="hover:opacity-60 transition-opacity relative" aria-label="Корзина">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-5 h-5 rounded-full flex items-center justify-center">
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
                    <Button variant="ghost" size="icon" className="hover:opacity-60 transition-opacity">
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
                </DropdownMenu> : <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className="hover:opacity-60 transition-opacity">
                  <User className="w-5 h-5" />
                </Button>}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && <div className="lg:hidden border-t border-border bg-background">
            <nav className="flex flex-col py-4" role="navigation" aria-label="Мобильная навигация">
              <Link to="/about" className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                О БРЕНДЕ
              </Link>
              <Link to="/catalog" className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                КАТАЛОГ
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