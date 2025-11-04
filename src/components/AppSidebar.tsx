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

const infoMenuItems = [
  { id: "brand", label: "О Бренде" },
  { id: "cooperation", label: "Сотрудничество" },
  { id: "delivery", label: "Оплата и доставка" },
  { id: "returns", label: "Возврат" },
  { id: "size-guide", label: "Гид по размерам" },
  { id: "agreement", label: "Пользовательское соглашение" },
  { id: "warranty", label: "Гарантия" },
  { id: "loyalty", label: "Программа лояльности и бонусы" },
  { id: "contacts", label: "Контакты" },
  { id: "stores", label: "Магазины" }
];

export function AppSidebar({ selectedCategory, onCategoryChange, activeInfoSection, onInfoSectionChange }: AppSidebarProps) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isInfoPage = location.pathname === "/info";
  const isProductPage = location.pathname.startsWith("/product/");
  const isCatalogPage = location.pathname === "/catalog";
  const isCatalogRelated = isCatalogPage || isProductPage;
  const { data: categories, isLoading } = useCategories();
  const { data: settings } = useSiteSettings();
  
  const getSetting = (key: string, defaultValue: any = '') => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const instagramUrl = getSetting('social_instagram', 'https://instagram.com');
  const telegramUrl = getSetting('social_telegram', 'https://t.me');
  const vkUrl = getSetting('social_vk', 'https://vk.com');

  return (
    <aside className="w-[307px] border-r border-border bg-muted flex-shrink-0 h-screen overflow-y-auto">
      <div className="flex flex-col items-center justify-center h-screen py-10">
        {isHomePage && (
          <p 
            className="text-xs tracking-[0.3em] uppercase"
            style={{ 
              writingMode: 'vertical-rl',
              textOrientation: 'mixed'
            }}
          >
            Feel the moment
          </p>
        )}

        {isCatalogRelated && (
          <>
            <Link to="/" className="block mb-8">
              <img src={logoImage} alt="ANDO JV" className="block w-28 h-auto" />
            </Link>
            <nav className="w-28 text-left">
              <ul className="list-none m-0 p-0 space-y-3">
                <li>
                  <Link
                    to="/catalog"
                    onClick={() => onCategoryChange?.("Все товары")}
                    className={`block text-sm tracking-wide hover:opacity-60 transition-opacity ${
                      selectedCategory === "Все товары" ? "underline" : ""
                    }`}
                  >
                    Все товары
                  </Link>
                </li>
                {!isLoading && categories?.map((category) => (
                  <li key={category.id}>
                    <Link
                      to="/catalog"
                      onClick={() => onCategoryChange?.(category.name)}
                      className={`block text-sm tracking-wide hover:opacity-60 transition-opacity ${
                        category.name === selectedCategory ? "underline" : ""
                      }`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}

        {isInfoPage && (
          <>
            <Link to="/" className="block mb-8">
              <img src={logoImage} alt="ANDO JV" className="block w-28 h-auto" />
            </Link>
            <nav className="w-28 text-left">
              <ul className="list-none m-0 p-0 space-y-3">
                {infoMenuItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      to="/info"
                      onClick={() => onInfoSectionChange?.(item.id)}
                      className={`block text-sm tracking-wide hover:opacity-60 transition-opacity ${
                        activeInfoSection === item.id ? "underline" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-[8px] text-center leading-relaxed text-muted-foreground px-6">
        © 2025 ANDO JV. Все права<br />
        защищены. Не является публичной<br />
        офертой.
      </div>
    </aside>
  );
}
