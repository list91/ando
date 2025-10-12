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
    <div className={`relative h-[calc(100vh-4rem)] overflow-hidden transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      {activeSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('${slide.image_url}')`
            }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h1 
                className="text-8xl mb-4 font-extralight tracking-[0.3em]"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
              >
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="text-sm tracking-[0.2em] max-w-md text-center opacity-80">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {activeSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Scroll down indicator */}
      <button
        onClick={navigateToCatalog}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-white animate-fade-in hover:opacity-70 transition-opacity"
      >
        <span className="text-xs tracking-widest uppercase">Листайте вниз</span>
        <ChevronDown className="w-6 h-6 animate-bounce" />
      </button>
    </div>
  );
};

export default Home;
