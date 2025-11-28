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
      <div className="relative h-full overflow-hidden">
        <div className="absolute inset-0 bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <SchemaOrg type="organization" />
      
      <main className="relative h-full overflow-hidden" role="main">
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

        {/* Scroll Down Indicator — абсолютно позиционирован, всегда видим */}
        <button
          onClick={navigateToCatalog}
          className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-white animate-bounce hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Прокрутить вниз"
        >
          <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </main>
    </>
  );
};

export default Home;
