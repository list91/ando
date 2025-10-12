import { ReactNode } from "react";
import Header from "./Header";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface LayoutProps {
  children: ReactNode;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  activeInfoSection: string;
  onInfoSectionChange: (section: string) => void;
}

const Layout = ({ children, selectedCategory, onCategoryChange, activeInfoSection, onInfoSectionChange }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          selectedCategory={selectedCategory} 
          onCategoryChange={onCategoryChange}
          activeInfoSection={activeInfoSection}
          onInfoSectionChange={onInfoSectionChange}
        />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
