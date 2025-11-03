import { Link, useLocation } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Instagram, Send } from "lucide-react";

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
          <div className="border border-foreground p-3 text-center w-20">
            <div className="text-lg font-light tracking-[0.2em]">AN</div>
            <div className="text-lg font-light tracking-[0.2em]">DO</div>
            <div className="w-full h-[1px] bg-foreground my-1" />
            <div className="text-[10px] tracking-[0.3em]">JV</div>
          </div>
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

        <div className="flex gap-3 justify-center mb-4">
          {instagramUrl && (
            <a 
              href={instagramUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-3 h-3" />
            </a>
          )}
          {telegramUrl && (
            <a 
              href={telegramUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
              aria-label="Telegram"
            >
              <Send className="w-3 h-3" />
            </a>
          )}
          {vkUrl && (
            <a 
              href={vkUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
              aria-label="VKontakte"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.572-1.497c.583-.19 1.332 1.26 2.127 1.818.6.422 1.056.329 1.056.329l2.123-.03s1.11-.07.584-.963c-.043-.073-.308-.663-1.588-1.876-1.34-1.27-1.16-1.065.453-3.263.983-1.34 1.375-2.158 1.252-2.508-.117-.334-.84-.246-.84-.246l-2.39.015s-.177-.025-.308.056c-.128.079-.21.263-.21.263s-.377 1.025-.88 1.897c-1.06 1.836-1.484 1.933-1.658 1.818-.405-.267-.304-1.075-.304-1.648 0-1.792.265-2.54-.517-2.732-.26-.064-.452-.106-1.118-.113-.854-.009-1.577.003-1.988.208-.273.137-.484.441-.355.458.159.022.52.1.711.365.247.343.238 1.113.238 1.113s.142 2.11-.331 2.372c-.325.18-.77-.187-1.726-1.865-.49-.849-.86-1.787-.86-1.787s-.071-.178-.198-.274c-.154-.116-.37-.153-.37-.153l-2.271.015s-.341.01-.466.161c-.111.134-.009.411-.009.411s1.78 4.257 3.795 6.403c1.85 1.968 3.95 1.838 3.95 1.838h.953z"/>
              </svg>
            </a>
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
