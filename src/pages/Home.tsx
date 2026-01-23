import { useRef, useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useHeroSlides } from "@/hooks/useHeroSlides";
import { ChevronDown } from "lucide-react";
import SchemaOrg from "@/components/SchemaOrg";

const Home = () => {
  const navigate = useNavigate();
  const { data: slides, isLoading } = useHeroSlides();
  const containerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const activeSlide = slides?.find(slide => slide.is_active);
  const desktopUrl = activeSlide?.image_url || "";
  const tabletUrl = activeSlide?.image_url_tablet || desktopUrl;
  const mobileUrl = activeSlide?.image_url_mobile || tabletUrl;

  // Scroll hijacking - один скролл вниз запускает полную анимацию
  useEffect(() => {
    const container = containerRef.current;
    const spacer = spacerRef.current;
    if (!container || !spacer) return;

    let hasNavigated = false;
    let isAnimating = false;

    // Обновление прогресса анимации - используем реальные размеры контейнера
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      // Прогресс от 0 до 1 на основе реального скролла
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      setScrollProgress(progress);

      // Переход на середине анимации (50%)
      if (progress >= 0.5 && !hasNavigated) {
        hasNavigated = true;
        navigate('/catalog');
      }
    };

    // Запуск анимации - scrollIntoView гарантирует полный скролл
    const triggerFullScroll = () => {
      if (isAnimating || hasNavigated) return;
      isAnimating = true;
      spacer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Перехват колеса мыши
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        e.preventDefault();
        triggerFullScroll();
      }
    };

    // Перехват touch для мобильных
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      // Свайп вверх (скролл вниз)
      if (deltaY > 30) {
        e.preventDefault();
        triggerFullScroll();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [navigate]);

  const scrollToContent = () => {
    spacerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading || !desktopUrl) {
    return (
      <div className="relative h-full overflow-hidden">
        <div className="absolute inset-0 bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <SchemaOrg type="organization" />

      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Hero Section - анимируется при скролле */}
        <main
          className="relative h-full snap-start overflow-hidden"
          style={{
            opacity: 1 - scrollProgress * 0.7,
            transform: `scale(${1 + scrollProgress * 0.05})`,
          }}
          role="main"
        >
          {/* Mobile background */}
          <div
            className="absolute inset-0 bg-cover bg-center md:hidden transition-transform duration-300"
            style={{
              backgroundImage: `url('${mobileUrl}')`,
              filter: `blur(${scrollProgress * 8}px)`,
            }}
            role="img"
            aria-label="Главное изображение"
          />

          {/* Tablet background */}
          <div
            className="absolute inset-0 bg-cover bg-center hidden md:block lg:hidden transition-transform duration-300"
            style={{
              backgroundImage: `url('${tabletUrl}')`,
              filter: `blur(${scrollProgress * 8}px)`,
            }}
            role="img"
            aria-label="Главное изображение"
          />

          {/* Desktop background */}
          <div
            className="absolute inset-0 bg-cover bg-center hidden lg:block transition-transform duration-300"
            style={{
              backgroundImage: `url('${desktopUrl}')`,
              filter: `blur(${scrollProgress * 8}px)`,
            }}
            role="img"
            aria-label="Главное изображение"
          />

          <div className="absolute inset-0 bg-black/20" />

          <div className="relative h-full flex flex-col items-center justify-center text-white px-4 lg:px-8">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light mb-3 sm:mb-4 lg:mb-6 tracking-[0.3em] uppercase text-center max-w-4xl transition-all duration-300"
              style={{
                transform: `translateY(${-scrollProgress * 30}px)`,
                opacity: 1 - scrollProgress,
              }}
            >
              {activeSlide?.title || "FEEL THE MOMENT"}
            </h1>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={scrollToContent}
            className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-white animate-bounce hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ opacity: 1 - scrollProgress * 2 }}
            aria-label="Прокрутить вниз"
          >
            <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </main>

        {/* Spacer section для активации скролла */}
        <section ref={spacerRef} className="h-screen snap-start bg-background" />
      </div>
    </>
  );
};

export default Home;
