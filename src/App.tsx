import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import Lookbook from "./pages/Lookbook";
import About from "./pages/About";
import Info from "./pages/Info";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AdminOrders from "./pages/admin/Orders";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminSiteSettings from "./pages/admin/SiteSettings";
import AdminLookbook from "./pages/admin/Lookbook";
import AdminInfoPages from "./pages/admin/InfoPages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [selectedCategory, setSelectedCategory] = useState("Все товары");
  const [activeInfoSection, setActiveInfoSection] = useState("delivery");

  return (
    <Layout 
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      activeInfoSection={activeInfoSection}
      onInfoSectionChange={setActiveInfoSection}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/catalog" 
          element={<Catalog selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />} 
        />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/lookbook" element={<Lookbook />} />
        <Route path="/about" element={<About />} />
        <Route 
          path="/info" 
          element={<Info activeSection={activeInfoSection} setActiveSection={setActiveInfoSection} />} 
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="manager">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="site-settings" element={<AdminSiteSettings />} />
          <Route path="lookbook" element={<AdminLookbook />} />
          <Route path="info-pages" element={<AdminInfoPages />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
