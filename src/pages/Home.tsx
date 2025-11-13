import { useNavigate } from "react-router-dom";
import { useSiteSetting } from "@/hooks/useSiteSettings";
import { ChevronDown } from "lucide-react";
import SchemaOrg from "@/components/SchemaOrg";

const Home = () => {
  const navigate = useNavigate();
  const { data: heroImageSetting, isLoading } = useSiteSetting('hero_image');
  
  const heroImageUrl = heroImageSetting?.value as string || "";

  const navigateToCatalog = () => {
    navigate('/catalog');
  };

  if (isLoading || !heroImageUrl) {
    return (
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <SchemaOrg type="organization" />
      
      <main className="relative h-[calc(100vh-4rem)] overflow-hidden" role="main">
        {/* Vertical text on the left */}
        <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10">
          <div className="flex flex-col items-center gap-6 text-foreground/20 text-xs sm:text-sm tracking-[0.3em] font-light" style={{ writingMode: 'vertical-rl' }}>
            FEEL THE MOMENT IN TRADITIONALITY
          </div>
        </div>

        <div 
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('${heroImageUrl}')`
          }}
          role="img"
          aria-label="Главное изображение"
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative h-full flex flex-col items-center justify-center text-white px-4 lg:px-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light mb-3 sm:mb-4 lg:mb-6 tracking-[0.3em] uppercase text-center max-w-4xl">
              FEEL THE MOMENT
            </h1>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <button
          onClick={navigateToCatalog}
          className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 text-white animate-bounce hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Прокрутить вниз"
        >
          <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </main>
    </>
  );
};

export default Home;
