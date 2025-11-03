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
    <aside className="w-64 border-r border-border bg-muted flex-shrink-0 h-screen overflow-y-auto">
      <div className="flex flex-col h-full py-8 px-6">
        <Link to="/" className="mb-12 flex justify-center">
          <img src={logoImage} alt="ANDO JV" className="w-32" />
        </Link>

        <div className="flex-1">
          {isHomePage && (
            <div className="flex items-center justify-center h-full">
              <p 
                className="text-xs tracking-[0.3em] uppercase"
                style={{ 
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed'
                }}
              >
                Feel the moment
              </p>
            </div>
          )}

          {isCatalogRelated && (
            <nav className="space-y-2 pl-16">
              <Link
                to="/catalog"
                onClick={() => onCategoryChange?.("Все товары")}
                className={`block w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${
                  selectedCategory === "Все товары" ? "underline" : ""
                }`}
              >
                Все товары
              </Link>
              {!isLoading && categories?.map((category) => (
                <Link
                  key={category.id}
                  to="/catalog"
                  onClick={() => onCategoryChange?.(category.name)}
                  className={`block w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${
                    category.name === selectedCategory ? "underline" : ""
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          )}

          {isInfoPage && (
            <nav className="space-y-2">
              {infoMenuItems.map((item) => (
                <Link
                  key={item.id}
                  to="/info"
                  onClick={() => onInfoSectionChange?.(item.id)}
                  className={`block w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${
                    activeInfoSection === item.id ? "underline" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>


        <div className="text-[8px] text-center leading-relaxed text-muted-foreground">
          © 2025 ANDO JV. Все права<br />
          защищены. Не является публичной<br />
          офертой.
        </div>
      </div>
    </aside>
  );
}
