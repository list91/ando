import { useState, useEffect } from "react";
import heroSlide from "@/assets/hero-slide.jpeg";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "THE ROW",
      subtitle: "Когда в поисковой строке начинаем набирать текст она опускается ниже",
      image: heroSlide
    },
    {
      title: "THE ROW",
      subtitle: "",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('${slide.image}')`
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
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
