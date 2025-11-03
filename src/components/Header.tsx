import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, LogOut, Menu as MenuIcon, ShieldCheck, Package } from "lucide-react";
import { useState, useEffect } from "react";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'manager']);

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

  return (
    <>
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          {/* Left spacer - hidden on mobile */}
          <div className="hidden lg:block flex-1" />
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-16">
            <Link 
              to="/catalog" 
              className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-opacity pb-1 border-b-2 ${
                location.pathname === '/catalog' || location.pathname.startsWith('/product/') 
                  ? 'border-[#8FBE3F]' 
                  : 'border-transparent'
              }`}
            >
              КАТАЛОГ
            </Link>
            <Link 
              to="/about" 
              className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-opacity pb-1 border-b-2 ${
                location.pathname === '/about' 
                  ? 'border-[#8FBE3F]' 
                  : 'border-transparent'
              }`}
            >
              О БРЕНДЕ
            </Link>
            <Link 
              to="/lookbook" 
              className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-opacity pb-1 border-b-2 ${
                location.pathname === '/lookbook' 
                  ? 'border-[#8FBE3F]' 
                  : 'border-transparent'
              }`}
            >
              LOOKBOOK
            </Link>
            <Link 
              to="/info" 
              className={`text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-opacity pb-1 border-b-2 ${
                location.pathname === '/info' 
                  ? 'border-[#8FBE3F]' 
                  : 'border-transparent'
              }`}
            >
              INFO +
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden hover:opacity-60 transition-opacity"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Right Icons */}
          <div className="flex-1 flex items-center justify-end gap-3 lg:gap-6">
            {/* Search - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <input
                type="text"
                placeholder=""
                className="w-32 bg-transparent border-b border-border focus:outline-none text-sm"
              />
              <button className="hover:opacity-60 transition-opacity">
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Cart */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="hover:opacity-60 transition-opacity relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Favorites - hidden on small mobile */}
            <Link 
              to="/favorites"
              className="hidden sm:block hover:opacity-60 transition-opacity"
            >
              <Heart className="w-5 h-5" />
            </Link>
            
            {/* User Menu */}
            {user ? (
              <DropdownMenu>
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
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Админ-панель
                    </DropdownMenuItem>
                  )}
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
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/auth')}
                className="hover:opacity-60 transition-opacity"
              >
                <User className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <nav className="flex flex-col py-4">
              <Link 
                to="/catalog" 
                className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                КАТАЛОГ
              </Link>
              <Link 
                to="/about" 
                className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                О БРЕНДЕ
              </Link>
              <Link 
                to="/lookbook" 
                className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                LOOKBOOK
              </Link>
              <Link 
                to="/info" 
                className="px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-muted transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                INFO +
              </Link>
              {/* Mobile Search */}
              <div className="px-6 py-3 flex items-center gap-2 md:hidden">
                <input
                  type="text"
                  placeholder="Поиск..."
                  className="flex-1 bg-transparent border-b border-border focus:outline-none text-sm py-2"
                />
                <Search className="w-5 h-5" />
              </div>
            </nav>
          </div>
        )}
      </header>
    
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
