import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLookbookSeasons, useLookbookImages } from "@/hooks/useLookbook";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const LookbookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: seasons, isLoading: seasonsLoading } = useLookbookSeasons();
  const season = seasons?.find(s => s.slug === slug);
  const { data: images, isLoading: imagesLoading } = useLookbookImages(season?.id);

  const visibleImages = images?.filter(img => img.is_visible) || [];

  if (seasonsLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground mb-4">Лукбук не найден</p>
        <Link to="/lookbook">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Вернуться к списку
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Верхний текстовый блок */}
      {(season.title || season.subtitle || season.description) && (
        <div className="border-b border-border py-12 px-8">
          <div className="max-w-3xl mx-auto">
            <Link to="/lookbook" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Назад к лукбукам
            </Link>
            
            {season.title && (
              <h1 className="text-3xl md:text-4xl font-light mb-3 tracking-wide">
                {season.title}
              </h1>
            )}
            
            {season.subtitle && (
              <p className="text-lg md:text-xl text-muted-foreground mb-4">
                {season.subtitle}
              </p>
            )}
            
            {season.description && (
              <div 
                className="prose prose-sm md:prose-base max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: season.description }}
              />
            )}
          </div>
        </div>
      )}

      {/* Галерея изображений - слайдер */}
      {imagesLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : visibleImages.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Изображения скоро появятся</p>
        </div>
      ) : (
        <div className="py-8 px-4 md:px-12">
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {visibleImages.map((image) => (
                <CarouselItem key={image.id}>
                  <div className="flex flex-col items-center">
                    <div className="w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-lg">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || season.season_name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    {image.caption && (
                      <div className="mt-6 text-center max-w-2xl">
                        <p className="text-sm md:text-base text-muted-foreground">
                          {image.caption}
                        </p>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:-left-12" />
            <CarouselNext className="right-2 md:-right-12" />
          </Carousel>

          {/* Индикатор слайдов */}
          <div className="flex justify-center gap-2 mt-6">
            {visibleImages.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-muted transition-colors"
              />
            ))}
          </div>
        </div>
      )}

      {/* Кредит фотографа внизу */}
      {visibleImages.length > 0 && visibleImages[0]?.photographer_credit && (
        <div className="py-16 text-center border-t border-border">
          <p className="text-sm tracking-wide text-muted-foreground">
            Фотография: {visibleImages[0].photographer_credit}
          </p>
        </div>
      )}
    </div>
  );
};

export default LookbookDetail;
