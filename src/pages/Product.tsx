import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const Product = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState(0);
  
  const product = {
    name: "СВИТШОТ «ПИОН»»",
    article: "GP85k12",
    price: 7999,
    oldPrice: 8800,
    sale: 10,
    color: "розовый",
    material: "хлопок 100%",
    sizes: ["S", "M", "L"],
    colors: ["#C4A4C4", "#E8E8E8"],
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=80",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=80"
    ]
  };

  const [currentImage, setCurrentImage] = useState(0);

  const handleAddToCart = () => {
    addToCart({
      id: Number(id),
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: product.color,
      image: product.images[0],
    });
    toast.success("Товар добавлен в корзину");
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center py-16 px-8">
          <div className="relative max-w-xl">
            <button 
              onClick={() => setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hover:opacity-60 transition-opacity"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <img
              src={product.images[currentImage]}
              alt={product.name}
              className="w-full"
            />

            <button 
              onClick={() => setCurrentImage((prev) => (prev + 1) % product.images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hover:opacity-60 transition-opacity"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="flex gap-2 justify-center mt-4">
              {product.colors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(idx)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    idx === selectedColor ? "border-foreground" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-96 border-l border-border py-16 px-8">
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-xl tracking-[0.15em] uppercase">
              {product.name}
            </h1>
            {product.sale && (
              <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                -{product.sale}%
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-8">
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {product.oldPrice}
              </span>
            )}
            <span className="text-2xl font-medium">
              {product.price} ₽
            </span>
          </div>

          <div className="space-y-4 mb-8 text-sm">
            <div>
              <span className="text-muted-foreground">Артикул:</span> {product.article}
            </div>
            <div>
              <span className="text-muted-foreground">Цвет:</span> {product.color}
            </div>
            <div>
              <span className="text-muted-foreground">Состав:</span> {product.material}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm mb-3">Размер:</div>
            <div className="flex gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 border border-border hover:border-foreground transition-colors ${
                    selectedSize === size ? "bg-foreground text-background" : ""
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <Link to="#" className="text-xs underline mt-2 inline-block">
              Информация о размерах товара
            </Link>
          </div>

          <div className="flex gap-3 mb-8">
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-foreground text-background py-4 px-6 text-sm tracking-wide uppercase hover:opacity-90 transition-opacity"
            >
              ДОБАВИТЬ В КОРЗИНУ
            </button>
            <button className="w-12 h-12 border border-border hover:border-foreground transition-colors flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          <div className="text-sm mb-3">
            В другом цвете: <Link to="#" className="underline">Голубой</Link>
          </div>

          <div className="space-y-6 text-sm pt-8 border-t border-border">
            <div>
              <h3 className="font-medium mb-2">ДОСТАВКА</h3>
              <p className="text-muted-foreground leading-relaxed">
                Доставка по России за 1-7 дней, бесплатно<br />
                По Санкт-Петербургу и Москве доставка заказа возможна доставка на следующий день. 
                Стоимость доставки от 1500 руб.<br />
                Подробнее на странице <Link to="/info" className="underline">Доставка</Link>
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">ОПЛАТА</h3>
              <p className="text-muted-foreground leading-relaxed">
                Онлайн оплата через платежную систему CloudPayments<br />
                Принимаются карты VISA, MasterCard, платежная система «Мир»<br />
                Подробнее на странице <Link to="/info" className="underline">Оплата</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
