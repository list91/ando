import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

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

const categories = [
  "Топы",
  "Блузки",
  "Рубашки",
  "Юбки",
  "Брюки",
  "Свитшот",
  "Куртки",
  "Жакеты",
  "Свитера",
  "Толстовки",
  "Худи",
  "SALE %"
];

export function AppSidebar({ selectedCategory, onCategoryChange, activeInfoSection, onInfoSectionChange }: AppSidebarProps) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isInfoPage = location.pathname === "/info";
  const isCatalogRelated = !isHomePage && !isInfoPage;

  return (
    <Sidebar className="border-r border-border">
      <div className="flex flex-col h-full pt-6 pb-6">
        <Link to="/" className="mb-12 px-6 flex justify-center">
          <div className="border border-foreground p-3 text-center w-20">
            <div className="text-lg font-light tracking-[0.2em]">AN</div>
            <div className="text-lg font-light tracking-[0.2em]">DO</div>
            <div className="w-full h-[1px] bg-foreground my-1" />
            <div className="text-[10px] tracking-[0.3em]">JV</div>
          </div>
        </Link>

        <SidebarContent className="flex-1">
          <SidebarGroup>
            <SidebarGroupContent>
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
                <SidebarMenu className="space-y-2 px-6">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => onCategoryChange?.("Все товары")}
                      className={`w-full justify-start text-sm tracking-wide hover:opacity-60 transition-opacity ${
                        selectedCategory === "Все товары" ? "underline" : ""
                      }`}
                    >
                      Все товары
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {categories.map((category) => (
                    <SidebarMenuItem key={category}>
                      <SidebarMenuButton
                        onClick={() => onCategoryChange?.(category)}
                        className={`w-full justify-start text-sm tracking-wide hover:opacity-60 transition-opacity ${
                          category === selectedCategory ? "underline" : ""
                        } ${category === "SALE %" ? "text-accent" : ""}`}
                      >
                        {category}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}

              {isInfoPage && (
                <SidebarMenu className="space-y-2 px-6">
                  {infoMenuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onInfoSectionChange?.(item.id)}
                        className={`w-full justify-start text-sm tracking-wide hover:opacity-60 transition-opacity ${
                          activeInfoSection === item.id ? "underline" : ""
                        }`}
                      >
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <div className="text-[8px] text-center leading-relaxed text-muted-foreground px-2">
          © 2025 ANDO JV. Все права<br />
          защищены. Не является публичной<br />
          офертой.
        </div>
      </div>
    </Sidebar>
  );
}
