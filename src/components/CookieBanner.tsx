import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-background border-t border-border py-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1 text-sm leading-relaxed">
            <p className="mb-2 tracking-wide">
              Мы используем файлы cookie для улучшения работы сайта, персонализации контента и анализа посещаемости.
            </p>
            <p className="text-xs text-muted-foreground">
              Продолжая использовать сайт, вы соглашаетесь с{" "}
              <Link to="/info?section=agreement" className="underline hover:no-underline">
                политикой конфиденциальности
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-xs tracking-wide border border-border hover:bg-muted transition-colors"
            >
              Отклонить
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 text-xs tracking-wide bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Принять
            </button>
            <button
              onClick={handleDecline}
              className="p-2 hover:opacity-60 transition-opacity lg:hidden"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
