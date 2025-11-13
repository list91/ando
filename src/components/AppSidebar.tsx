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
  label: "О Бренде"
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
  id: "agreement",
  label: "Пользовательское соглашение"
}, {
  id: "warranty",
  label: "Гарантия"
}, {
  id: "loyalty",
  label: "Программа лояльности и бонусы"
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
  return <aside className="w-[307px] border-r border-border bg-muted flex-shrink-0 h-screen overflow-y-auto relative">
      <div className="flex flex-col min-h-full pt-0 pb-[200px] px-6">
        <Link 
          to="/" 
          className="mb-8 flex justify-center -mt-2"
          aria-label="На главную страницу"
        >
          <img src={logoImage} alt="ANDO JV" className="w-[432px]" />
        </Link>

        <div className="flex justify-center">
          {isHomePage && <div className="flex items-center justify-center">
              <p className="text-xs tracking-[0.3em] uppercase" style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}>
                Feel the moment
              </p>
            </div>}

          {isCatalogRelated && <nav className="space-y-2 flex flex-col pl-6 mx-[55px]">
              <Link to="/catalog" onClick={() => onCategoryChange?.("Все товары")} className={`block w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${selectedCategory === "Все товары" ? "underline" : ""}`}>
                Все товары
              </Link>
              {!isLoading && categories?.map(category => <Link key={category.id} to="/catalog" onClick={() => onCategoryChange?.(category.name)} className={`block w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${category.name === selectedCategory ? "underline" : ""}`}>
                  {category.name}
                </Link>)}
            </nav>}

          {isInfoPage && <nav className="space-y-2 flex flex-col pl-6 my-0 px-[55px] mx-[53px]">
              {infoMenuItems.map(item => <Link key={item.id} to="/info" onClick={() => onInfoSectionChange?.(item.id)} className={`block w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${activeInfoSection === item.id ? "underline" : ""}`}>
                  {item.label}
                </Link>)}
            </nav>}
        </div>
      </div>

      {/* Фиксированный блок внизу */}
      <div className="absolute bottom-0 left-0 right-0 text-xs text-center leading-snug text-muted-foreground pb-4 px-4 bg-muted">
        © 2025 ANDO JV. Все права<br />
        защищены. Не является публичной<br />
        офертой.
      </div>
    </aside>;
}