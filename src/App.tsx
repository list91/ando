import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import Lookbook from "./pages/Lookbook";
import About from "./pages/About";
import Info from "./pages/Info";
import Auth from "./pages/Auth";
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
