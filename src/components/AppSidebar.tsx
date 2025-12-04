import { Link, useLocation } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoImage from "@/assets/logo.png";
interface AppSidebarProps {
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  activeInfoSection?: string;
  onInfoSectionChange?: (section: string) => void;
}
const infoMenuItems = [{
  id: "brand",
  label: "О бренде"
}, {
  id: "cooperation",
  label: "Сотрудничество"
}, {
  id: "delivery",
  label: "Оплата и доставка"
}, {
  id: "returns",
  label: "Возврат"
}, {
  id: "size-guide",
  label: "Гид по размерам"
}, {
  id: "warranty",
  label: "Гарантия"
}, {
  id: "loyalty",
  label: "Программа лояльности"
}, {
  id: "privacy",
  label: "Политика конфиденциальности"
}, {
  id: "agreement",
  label: "Пользовательское соглашение"
}, {
  id: "offer",
  label: "Публичная оферта"
}, {
  id: "pd-consent",
  label: "Согласие на обработку ПД"
}, {
  id: "newsletter-consent",
  label: "Согласие на рассылку"
}, {
  id: "contacts",
  label: "Контакты"
}, {
  id: "stores",
  label: "Магазины"
}];
export function AppSidebar({
  selectedCategory,
  onCategoryChange,
  activeInfoSection,
  onInfoSectionChange
}: AppSidebarProps) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isInfoPage = location.pathname === "/info";
  const isProductPage = location.pathname.startsWith("/product/");
  const isCatalogPage = location.pathname === "/catalog";
  const isCatalogRelated = isCatalogPage || isProductPage;
  const {
    data: categories,
    isLoading
  } = useCategories();
  const {
    data: settings
  } = useSiteSettings();
  const getSetting = (key: string, defaultValue: any = '') => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value || defaultValue;
  };
  const instagramUrl = getSetting('social_instagram', 'https://instagram.com');
  const telegramUrl = getSetting('social_telegram', 'https://t.me');
  const vkUrl = getSetting('social_vk', 'https://vk.com');
  return <aside className="w-[307px] border-r border-border bg-muted flex-shrink-0 h-screen flex flex-col overflow-hidden">
      {/* Логотип — фиксированный */}
      <div className="flex-shrink-0 px-6">
        <Link
          to="/"
          className="mb-8 flex justify-center -mt-2"
          aria-label="На главную страницу"
        >
          <img src={logoImage} alt="ANDO JV" className="w-[432px]" />
        </Link>
      </div>

      {/* Контент — прижат к верху, масштабируется по высоте контейнера */}
      <div className="flex-1 min-h-0 flex items-start justify-center overflow-hidden px-6 sidebar-menu-container">
        {isHomePage && (
          <p className="text-xs tracking-[0.3em] uppercase" style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}>
            Feel the moment
          </p>
        )}

        {isCatalogRelated && <nav className="flex flex-col pl-6 mx-[55px] sidebar-menu-adaptive">
            <Link to="/catalog" onClick={() => onCategoryChange?.("NEW")} className={`block w-full text-left tracking-wide hover:opacity-60 transition-opacity whitespace-nowrap ${selectedCategory === "NEW" ? "underline" : ""}`}>
              NEW
            </Link>
            <Link to="/catalog" onClick={() => onCategoryChange?.("Все товары")} className={`block w-full text-left tracking-wide hover:opacity-60 transition-opacity whitespace-nowrap ${selectedCategory === "Все товары" ? "underline" : ""}`}>
              Все товары
            </Link>
            {!isLoading && categories?.map(category => <Link key={category.id} to="/catalog" onClick={() => onCategoryChange?.(category.name)} className={`block w-full text-left tracking-wide hover:opacity-60 transition-opacity whitespace-nowrap ${category.name === selectedCategory ? "underline" : ""}`}>
                {category.name}
              </Link>)}
            <Link to="/catalog" onClick={() => onCategoryChange?.("SALE")} className={`block w-full text-left tracking-wide hover:opacity-60 transition-opacity whitespace-nowrap ${selectedCategory === "SALE" ? "underline" : ""}`}>
              SALE
            </Link>
          </nav>}

        {isInfoPage && <nav className="flex flex-col pl-6 my-0 px-4 sidebar-menu-adaptive">
            {infoMenuItems.map(item => <Link key={item.id} to="/info" onClick={() => onInfoSectionChange?.(item.id)} className={`block w-full text-left tracking-wide hover:opacity-60 transition-opacity whitespace-nowrap ${activeInfoSection === item.id ? "underline" : ""}`}>
                {item.label}
              </Link>)}
          </nav>}
      </div>

      {/* Копирайт — фиксированный внизу */}
      <div className="flex-shrink-0 text-xs text-center leading-snug text-muted-foreground py-4 px-4 bg-muted">
        © 2025 ANDO JV. Все права<br />
        защищены. Не является публичной<br />
        офертой.
      </div>
    </aside>;
}