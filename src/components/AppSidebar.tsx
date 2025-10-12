import { Link, useLocation } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";

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
  const isCatalogRelated = !isHomePage && !isInfoPage;
  const { data: categories, isLoading } = useCategories();

  return (
    <aside className="w-64 border-r border-border bg-background flex-shrink-0 h-screen overflow-y-auto">
      <div className="flex flex-col h-full py-8 px-6">
        <Link to="/" className="mb-12">
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
            <nav className="space-y-2">
              <button
                onClick={() => onCategoryChange?.("Все товары")}
                className={`w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${
                  selectedCategory === "Все товары" ? "underline" : ""
                }`}
              >
                Все товары
              </button>
              {!isLoading && categories?.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange?.(category.name)}
                  className={`w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${
                    category.name === selectedCategory ? "underline" : ""
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </nav>
          )}

          {isInfoPage && (
            <nav className="space-y-2">
              {infoMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onInfoSectionChange?.(item.id)}
                  className={`w-full text-left text-sm tracking-wide hover:opacity-60 transition-opacity ${
                    activeInfoSection === item.id ? "underline" : ""
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        <div className="text-[8px] text-center leading-relaxed text-muted-foreground mt-8">
          © 2025 ANDO JV. Все права<br />
          защищены. Не является публичной<br />
          офертой.
        </div>
      </div>
    </aside>
  );
}
