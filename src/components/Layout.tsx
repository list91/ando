import { ReactNode, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { AppSidebar } from "./AppSidebar";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  activeInfoSection: string;
  onInfoSectionChange: (section: string) => void;
}

const Layout = ({ children, selectedCategory, onCategoryChange, activeInfoSection, onInfoSectionChange }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AppSidebar 
          selectedCategory={selectedCategory} 
          onCategoryChange={(category) => {
            onCategoryChange(category);
            setIsSidebarOpen(false);
          }}
          activeInfoSection={activeInfoSection}
          onInfoSectionChange={(section) => {
            onInfoSectionChange(section);
            setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-30">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-background shadow-md"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
