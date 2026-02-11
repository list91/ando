import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import CartDrawer from "./CartDrawer";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import logoImage from "@/assets/logo.png";
import logoMobile from "@/assets/logo-mobile.png";

interface LayoutProps {
  children: ReactNode;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedGender: string | null;
  onGenderChange: (gender: string | null) => void;
  activeInfoSection: string;
  onInfoSectionChange: (section: string) => void;
}

const Layout = ({ children, selectedCategory, onCategoryChange, selectedGender, onGenderChange, activeInfoSection, onInfoSectionChange }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
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
            selectedGender={selectedGender}
            onGenderChange={(gender) => {
              onGenderChange(gender);
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
          {/* Mobile Menu Button - hidden on mobile, MobileBottomNav handles it */}
          <div className="hidden lg:block fixed top-4 left-4 z-30">
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

          {/* Mobile Header with Logo - only on mobile */}
          <div className="md:hidden sticky top-0 z-40 bg-background border-b border-border">
            <Link to="/" className="flex justify-center py-2">
              <img src={logoMobile} alt="ANDO JV" className="w-36 h-auto" />
            </Link>
          </div>

          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation - outside overflow container */}
      <MobileBottomNav
        onCartOpen={() => setIsCartOpen(true)}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        activeInfoSection={activeInfoSection}
        onInfoSectionChange={onInfoSectionChange}
      />

      {/* Cart Drawer for Mobile Bottom Nav */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Layout;
