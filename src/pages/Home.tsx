import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHeroSlides } from "@/hooks/useHeroSlides";
import { ChevronDown } from "lucide-react";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const navigate = useNavigate();
  const { data: slides, isLoading } = useHeroSlides();
  
  const activeSlides = slides?.filter(s => s.is_active) || [];

  useEffect(() => {
    if (activeSlides.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const navigateToCatalog = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      navigate('/catalog');
    }, 600);
  };

  useEffect(() => {
    let touchStartY = 0;
    let scrollStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchEndY = e.touches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (diff > 50) {
        navigateToCatalog();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 50) {
        navigateToCatalog();
      }
    };

    const handleScroll = () => {
      if (window.scrollY > scrollStartY + 50) {
        navigateToCatalog();
      }
      scrollStartY = window.scrollY;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [navigate]);

  if (isLoading || activeSlides.length === 0) {
    return (
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <main className={`relative h-[calc(100vh-4rem)] overflow-hidden transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`} role="main">
      {activeSlides.map((slide, index) => (
        <section
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== currentSlide}
        >
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('${slide.image_url}')`
            }}
            role="img"
            aria-label={slide.title}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative h-full flex flex-col items-center justify-center text-white px-4 lg:px-8">
              {slide.title && (
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light mb-3 sm:mb-4 lg:mb-6 tracking-[0.3em] uppercase text-center max-w-4xl">
                  {slide.title}
                </h1>
              )}
              {slide.subtitle && (
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-12 lg:mb-16 tracking-[0.15em] text-center max-w-2xl">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* Scroll Down Indicator */}
      <button
        onClick={navigateToCatalog}
        className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 text-white animate-bounce hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Прокрутить вниз"
      >
        <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* Slide Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2" role="navigation" aria-label="Индикаторы слайдов">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all min-w-[32px] min-h-[32px] flex items-center justify-center ${
                index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Слайд ${index + 1}`}
              aria-current={index === currentSlide}
            >
              <span className="sr-only">Слайд {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
};

export default Home;
