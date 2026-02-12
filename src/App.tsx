import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { CatalogSearchProvider } from "@/contexts/CatalogSearchContext";
import { CookieBanner } from "@/components/CookieBanner";
import { SupportChat } from "@/components/SupportChat";
// Build: 2026-01-22T02:50
import { AddToCartModal } from "@/components/AddToCartModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useState, useEffect } from "react";
import { initGA } from "@/lib/analytics";
import { usePageTracking } from "@/hooks/usePageTracking";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import LookbookList from "./pages/LookbookList";
import LookbookDetail from "./pages/LookbookDetail";
import About from "./pages/About";
import Info from "./pages/Info";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AdminOrders from "./pages/admin/Orders";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSiteSettings from "./pages/admin/SiteSettings";
import AdminLookbook from "./pages/admin/Lookbook";
import AdminInfoPages from "./pages/admin/InfoPages";
import AdminHeroSlides from "./pages/admin/HeroSlides";
import AdminHeroImage from "./pages/admin/HeroImage";
import AdminAboutPage from "./pages/admin/AboutPage";
import Favorites from "./pages/Favorites";
import Orders from "./pages/Orders";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

// Версия билда - меняется при каждом деплое (Vite заменяет при сборке)
const BUILD_VERSION = import.meta.env.VITE_BUILD_TIME || Date.now().toString();

// Проверяем, изменилась ли версия - если да, очищаем кэш
const STORED_VERSION_KEY = 'ando_build_version';
const storedVersion = localStorage.getItem(STORED_VERSION_KEY);
if (storedVersion !== BUILD_VERSION) {
  // Новый деплой - очищаем все кэши
  localStorage.setItem(STORED_VERSION_KEY, BUILD_VERSION);
  if ('caches' in window) {
    caches.keys().then(names => names.forEach(name => caches.delete(name)));
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаются "свежими" 1 минуту - баланс между скоростью и актуальностью
      staleTime: 1 * 60 * 1000,
      // Данные хранятся в памяти 5 минут после последнего использования
      gcTime: 5 * 60 * 1000,
      // При ошибке - 1 повторная попытка
      retry: 1,
      // Не перезапрашивать при фокусе окна (избегаем лишних запросов)
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  // BREAKING CHANGE: This will crash the app!
  throw new Error("💥 CRITICAL ERROR: Testing smoke test protection!");

  const [selectedCategory, setSelectedCategory] = useState("Все товары");
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [activeInfoSection, setActiveInfoSection] = useState("delivery");
  const { lastAddedProduct, clearLastAdded } = useCart();

  // Track page views
  usePageTracking();

  return (
    <>
      <Layout
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        activeInfoSection={activeInfoSection}
        onInfoSectionChange={setActiveInfoSection}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/catalog"
            element={<Catalog selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} selectedGender={selectedGender} setSelectedGender={setSelectedGender} />}
          />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/lookbook" element={<LookbookList />} />
          <Route path="/lookbook/:slug" element={<LookbookDetail />} />
          <Route path="/about" element={<About />} />
          <Route 
            path="/info" 
            element={<Info activeSection={activeInfoSection} setActiveSection={setActiveInfoSection} />} 
          />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/install" element={<Install />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="manager">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="site-settings" element={<AdminSiteSettings />} />
            <Route path="lookbook" element={<AdminLookbook />} />
            <Route path="info-pages" element={<AdminInfoPages />} />
            <Route path="hero-slides" element={<AdminHeroSlides />} />
            <Route path="hero-image" element={<AdminHeroImage />} />
            <Route path="about-page" element={<AdminAboutPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      
      <AddToCartModal 
        isOpen={!!lastAddedProduct}
        onClose={clearLastAdded}
        product={lastAddedProduct}
      />
    </>
  );
};

const App = () => {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CartProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <CatalogSearchProvider>
                      <AppContent />
                      <CookieBanner />
                      <SupportChat />
                    </CatalogSearchProvider>
                  </BrowserRouter>
                </TooltipProvider>
              </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
