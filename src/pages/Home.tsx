import { useRef, useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useHeroSlides } from "@/hooks/useHeroSlides";
import { ChevronDown } from "lucide-react";
import SchemaOrg from "@/components/SchemaOrg";

const Home = () => {
  const navigate = useNavigate();
  const { data: slides, isLoading } = useHeroSlides();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const activeSlide = slides?.find(slide => slide.is_active);
  const desktopUrl = activeSlide?.image_url || "";
  const tabletUrl = activeSlide?.image_url_tablet || desktopUrl;
  const mobileUrl = activeSlide?.image_url_mobile || tabletUrl;

  // Scroll hijacking - ручная анимация с редиректом на 50%
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let hasNavigated = false;
    let isAnimating = false;

    // Ручная анимация скролла
    const animateScroll = () => {
      if (isAnimating || hasNavigated) return;
      isAnimating = true;

      const startTime = performance.now();
      const startScroll = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const redirectPoint = maxScroll * 0.5;
      const duration = 800;

      if (maxScroll <= 0) return;

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const animate = (currentTime: number) => {
        if (hasNavigated) return;

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        const targetScroll = startScroll + (maxScroll - startScroll) * eased;
        container.scrollTop = targetScroll;

        const visualProgress = maxScroll > 0 ? targetScroll / maxScroll : 0;
        setScrollProgress(visualProgress);

        // Редирект на 50%
        if (targetScroll >= redirectPoint && !hasNavigated) {
          hasNavigated = true;
          navigate('/catalog');
          return;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    // Перехват колеса мыши
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        e.preventDefault();
        animateScroll();
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

      if (deltaY > 30) {
        e.preventDefault();
        animateScroll();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [navigate, isLoading]); // Перезапуск когда данные загрузились

  // Кнопка стрелки тоже запускает анимацию (но нужен ref на triggerAnimation)
  // Пока используем простой вариант
  const scrollToContent = () => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.scrollHeight - container.clientHeight;
    container.scrollTo({ top: target, behavior: 'smooth' });
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
        className="h-full overflow-y-auto"
      >
        {/* Hero Section - анимируется при скролле */}
        <main
          className="relative h-full overflow-hidden"
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
        <section className="h-screen bg-background" />
      </div>
    </>
  );
};

export default Home;
