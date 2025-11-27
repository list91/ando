const fs = require("fs");
const newContent = `import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useProduct } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SchemaOrg from "@/components/SchemaOrg";
import { Helmet } from "react-helmet-async";

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { data: product, isLoading } = useProduct(id || "");

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Товар не найден</p>
        <Link to="/catalog" className="underline">Вернуться в каталог</Link>
      </div>
    );
  }
