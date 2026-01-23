import { useState, useRef, useEffect } from "react";
import { Menu, Search, Heart, ShoppingBag, User, X, ChevronLeft } from "lucide-react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useProducts";

// INFO menu items (same as AppSidebar)
const infoMenuItems = [
  { id: "brand", label: "О бренде" },
  { id: "cooperation", label: "Сотрудничество" },
  { id: "delivery", label: "Оплата и доставка" },
  { id: "returns", label: "Возврат" },
  { id: "size-guide", label: "Гид по размерам" },
  { id: "warranty", label: "Гарантия" },
  { id: "loyalty", label: "Программа лояльности" },
  { id: "privacy", label: "Политика конфиденциальности" },
  { id: "agreement", label: "Пользовательское соглашение" },
  { id: "offer", label: "Публичная оферта" },
  { id: "pd-consent", label: "Согласие на обработку ПД" },
  { id: "newsletter-consent", label: "Согласие на рассылку" },
  { id: "contacts", label: "Контакты" },
  { id: "stores", label: "Магазины" },
];

interface MobileBottomNavProps {
  onCartOpen: () => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  activeInfoSection?: string;
  onInfoSectionChange?: (section: string) => void;
}

export const MobileBottomNav = ({
  onCartOpen,
  selectedCategory,
  onCategoryChange,
  activeInfoSection,
  onInfoSectionChange,
}: MobileBottomNavProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentGender = searchParams.get('gender') || 'women';

  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { user } = useAuth();

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const favoritesCount = favorites.length;

  // Determine current page type
  const isInfoPage = location.pathname === "/info";
  const isCatalogPage = location.pathname === "/catalog";
  const isProductPage = location.pathname.startsWith("/product/");
  const isCatalogRelated = isCatalogPage || isProductPage;

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSearchSubmit = () => {
    if (localSearchQuery.trim()) {
      // Navigate directly - catalog will read search from URL
      const query = localSearchQuery.trim();
      setIsSearchOpen(false);
      setLocalSearchQuery('');
      // Use setTimeout to ensure state updates complete before navigation
      setTimeout(() => {
        navigate(`/catalog?search=${encodeURIComponent(query)}`);
      }, 0);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (localSearchQuery) {
        setLocalSearchQuery('');
      } else {
        setIsSearchOpen(false);
      }
    } else if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setLocalSearchQuery('');
  };

  const handleAccountClick = () => {
    if (user) {
      navigate('/orders');
    } else {
      navigate('/auth');
    }
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleCategoryClick = (category: string) => {
    onCategoryChange?.(category);
    navigate(`/catalog?gender=${currentGender}`);
    setIsMenuOpen(false);
  };

  const handleInfoSectionClick = (sectionId: string) => {
    onInfoSectionChange?.(sectionId);
    navigate('/info');
    setIsMenuOpen(false);
  };

  const handleNavLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Fullscreen Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-[70] md:hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <button
              onClick={handleSearchClose}
              className="p-2 hover:opacity-60 transition-opacity"
              aria-label="Закрыть поиск"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск товаров..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-gray-50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                autoFocus
              />
              {localSearchQuery && (
                <button
                  onClick={() => setLocalSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Очистить"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearchSubmit}
              disabled={!localSearchQuery.trim()}
              className="p-2 hover:opacity-60 transition-opacity disabled:opacity-30"
              aria-label="Найти"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Search hints / recent */}
          <div className="flex-1 overflow-y-auto p-4">
            {!localSearchQuery && (
              <div className="text-center text-gray-400 mt-8">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Введите название товара</p>
                <p className="text-xs mt-1">например: пальто, куртка, брюки</p>
              </div>
            )}
            {localSearchQuery && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  Нажмите Enter или кнопку поиска
                </p>
                <button
                  onClick={handleSearchSubmit}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm">Искать: </span>
                  <span className="font-medium">{localSearchQuery}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-[70] md:hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <span className="text-sm uppercase tracking-wider text-gray-500">
              {isCatalogRelated ? "Категории" : isInfoPage ? "Информация" : "Меню"}
            </span>
            <button
              onClick={handleMenuClose}
              className="p-2 hover:opacity-60 transition-opacity"
              aria-label="Закрыть меню"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Content - scrollable */}
          <div className="flex-1 overflow-y-auto">

            {/* CATALOG MENU - Categories */}
            {isCatalogRelated && (
              <nav className="flex flex-col py-4">
                <button
                  onClick={() => handleCategoryClick("NEW")}
                  className={`px-6 py-3 text-left text-lg tracking-wide hover:bg-gray-50 transition-colors ${selectedCategory === "NEW" ? "font-medium" : ""}`}
                >
                  NEW
                </button>
                <button
                  onClick={() => handleCategoryClick("Все товары")}
                  className={`px-6 py-3 text-left text-lg tracking-wide hover:bg-gray-50 transition-colors ${selectedCategory === "Все товары" ? "font-medium" : ""}`}
                >
                  Все товары
                </button>
                {!categoriesLoading && categories?.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`px-6 py-3 text-left text-lg tracking-wide hover:bg-gray-50 transition-colors ${category.name === selectedCategory ? "font-medium" : ""}`}
                  >
                    {category.name}
                  </button>
                ))}
                <button
                  onClick={() => handleCategoryClick("SALE")}
                  className={`px-6 py-3 text-left text-lg tracking-wide hover:bg-gray-50 transition-colors text-red-600 ${selectedCategory === "SALE" ? "font-medium" : ""}`}
                >
                  SALE
                </button>

                {/* Divider */}
                <div className="my-4 border-t border-gray-200" />

                {/* Main navigation links */}
                <Link
                  to="/catalog?gender=women"
                  className="px-6 py-3 text-left text-base tracking-wide hover:bg-gray-50 transition-colors text-gray-600"
                  onClick={handleNavLinkClick}
                >
                  Женское
                </Link>
                <Link
                  to="/catalog?gender=men"
                  className="px-6 py-3 text-left text-base tracking-wide hover:bg-gray-50 transition-colors text-gray-600"
                  onClick={handleNavLinkClick}
                >
                  Мужское
                </Link>
                <Link
                  to="/lookbook"
                  className="px-6 py-3 text-left text-base tracking-wide hover:bg-gray-50 transition-colors text-gray-600"
                  onClick={handleNavLinkClick}
                >
                  Lookbook
                </Link>
                <Link
                  to="/info"
                  className="px-6 py-3 text-left text-base tracking-wide hover:bg-gray-50 transition-colors text-gray-600"
                  onClick={handleNavLinkClick}
                >
                  Info +
                </Link>
              </nav>
            )}

            {/* INFO MENU - Sections */}
            {isInfoPage && (
              <nav className="flex flex-col py-4">
                {infoMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleInfoSectionClick(item.id)}
                    className={`px-6 py-3 text-left text-lg tracking-wide hover:bg-gray-50 transition-colors ${activeInfoSection === item.id ? "font-medium" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}

                {/* Divider */}
                <div className="my-4 border-t border-gray-200" />

                {/* Main navigation links */}
                <Link
                  to="/catalog?gender=women"
                  className="px-6 py-3 text-left text-base tracking-wide hover:bg-gray-50 transition-colors text-gray-600"
                  onClick={handleNavLinkClick}
                >
                  Женское
                </Link>
                <Link
                  to="/catalog?gender=men"
                  className="px-6 py-3 text-left text-base tracking-wide hover:bg-gray-50 transition-colors text-gray-600"
                  onClick={handleNavLinkClick}
                >
                  Мужское
                </Link>
                <Link
                  to="/lookbook"
                  className="px-6 py-3 text-left text-base tracking-wide hover:bg-gray-50 transition-colors text-gray-600"
                  onClick={handleNavLinkClick}
                >
                  Lookbook
                </Link>
              </nav>
            )}

            {/* DEFAULT MENU - Main Navigation */}
            {!isCatalogRelated && !isInfoPage && (
              <nav className="flex flex-col items-center justify-center py-12 gap-8 min-h-[60vh]">
                <Link
                  to="/catalog?gender=women"
                  className="text-2xl uppercase tracking-[0.3em] hover:opacity-60 transition-opacity"
                  onClick={handleNavLinkClick}
                >
                  Женское
                </Link>
                <Link
                  to="/catalog?gender=men"
                  className="text-2xl uppercase tracking-[0.3em] hover:opacity-60 transition-opacity"
                  onClick={handleNavLinkClick}
                >
                  Мужское
                </Link>
                <Link
                  to="/lookbook"
                  className="text-2xl uppercase tracking-[0.3em] hover:opacity-60 transition-opacity"
                  onClick={handleNavLinkClick}
                >
                  Lookbook
                </Link>
                <Link
                  to="/info"
                  className="text-2xl uppercase tracking-[0.3em] hover:opacity-60 transition-opacity"
                  onClick={handleNavLinkClick}
                >
                  Info +
                </Link>
              </nav>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden z-[60]"
        role="navigation"
        aria-label="Мобильная навигация"
      >
        <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
          {/* Menu */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:opacity-60 transition-opacity min-w-[56px]"
            aria-label="Открыть меню"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider">Меню</span>
          </button>

          {/* Search */}
          <button
            onClick={handleSearchClick}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:opacity-60 transition-opacity min-w-[56px]"
            aria-label="Поиск"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider">Поиск</span>
          </button>

          {/* Favorites */}
          <Link
            to="/favorites"
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:opacity-60 transition-opacity min-w-[56px] relative"
            aria-label="Избранное"
          >
            <div className="relative">
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider">Избранное</span>
          </Link>

          {/* Cart */}
          <button
            onClick={onCartOpen}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:opacity-60 transition-opacity min-w-[56px] relative"
            aria-label="Корзина"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider">Корзина</span>
          </button>

          {/* Account */}
          <button
            onClick={handleAccountClick}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 hover:opacity-60 transition-opacity min-w-[56px]"
            aria-label={user ? "Мои заказы" : "Войти"}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider">
              {user ? "Профиль" : "Войти"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
