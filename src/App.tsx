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
import { AddToCartModal } from "@/components/AddToCartModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, Suspense } from "react";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";

// Lazy load routes for code splitting
import * as LazyRoutes from "./routes/LazyRoutes";

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-muted-foreground">Загрузка...</div>
  </div>
);

const AppContent = () => {
  const [selectedCategory, setSelectedCategory] = useState("Все товары");
  const [activeInfoSection, setActiveInfoSection] = useState("delivery");
  const { lastAddedProduct, clearLastAdded } = useCart();

  return (
    <>
      <Layout 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        activeInfoSection={activeInfoSection}
        onInfoSectionChange={setActiveInfoSection}
      >
        <Routes>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><LazyRoutes.Home /></Suspense>} />
          <Route 
            path="/catalog" 
            element={<Suspense fallback={<PageLoader />}><LazyRoutes.Catalog selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} /></Suspense>} 
          />
          <Route path="/product/:id" element={<Suspense fallback={<PageLoader />}><LazyRoutes.Product /></Suspense>} />
          <Route path="/lookbook" element={<Suspense fallback={<PageLoader />}><LazyRoutes.Lookbook /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<PageLoader />}><LazyRoutes.About /></Suspense>} />
          <Route 
            path="/info" 
            element={<Suspense fallback={<PageLoader />}><LazyRoutes.Info activeSection={activeInfoSection} setActiveSection={setActiveInfoSection} /></Suspense>} 
          />
          <Route path="/auth" element={<Suspense fallback={<PageLoader />}><LazyRoutes.Auth /></Suspense>} />
          <Route path="/favorites" element={<Suspense fallback={<PageLoader />}><LazyRoutes.Favorites /></Suspense>} />
          <Route path="/orders" element={<Suspense fallback={<PageLoader />}><LazyRoutes.Orders /></Suspense>} />
          <Route path="/checkout" element={<Suspense fallback={<PageLoader />}><LazyRoutes.Checkout /></Suspense>} />
          <Route path="/order-success" element={<Suspense fallback={<PageLoader />}><LazyRoutes.OrderSuccess /></Suspense>} />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="manager">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminDashboard /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminOrders /></Suspense>} />
            <Route path="products" element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminProducts /></Suspense>} />
            <Route path="categories" element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminCategories /></Suspense>} />
            <Route path="site-settings" element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminSiteSettings /></Suspense>} />
            <Route path="lookbook" element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminLookbook /></Suspense>} />
            <Route path="info-pages" element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminInfoPages /></Suspense>} />
            <Route path="hero-slides" element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminHeroSlides /></Suspense>} />
            <Route path="about-page" element={<Suspense fallback={<PageLoader />}><LazyRoutes.AdminAboutPage /></Suspense>} />
          </Route>
          
          <Route path="*" element={<Suspense fallback={<PageLoader />}><LazyRoutes.NotFound /></Suspense>} />
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

const App = () => (
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
                </CatalogSearchProvider>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
