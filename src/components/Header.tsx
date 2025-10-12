import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, LogOut } from "lucide-react";
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
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
      <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-8">
        <div className="flex-1" />
        
        <nav className="flex items-center gap-12">
          <Link 
            to="/about" 
            className="text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-opacity"
          >
            О БРЕНДЕ
          </Link>
          <Link 
            to="/catalog" 
            className="text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-opacity"
          >
            КАТАЛОГ
          </Link>
          <Link 
            to="/lookbook" 
            className="text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-opacity"
          >
            LOOKBOOK
          </Link>
          <Link 
            to="/info" 
            className="text-sm uppercase tracking-[0.2em] hover:opacity-60 transition-opacity"
          >
            INFO +
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-end gap-6">
          <input
            type="text"
            placeholder=""
            className="w-32 bg-transparent border-b border-border focus:outline-none text-sm"
          />
          <button className="hover:opacity-60 transition-opacity">
            <Search className="w-5 h-5" />
          </button>
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
          <button className="hover:opacity-60 transition-opacity">
            <Heart className="w-5 h-5" />
          </button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:opacity-60 transition-opacity">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin/orders')}>
                    Админ-панель
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/orders')}>
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
    </header>
    
    <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
