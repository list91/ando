import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
// ChevronLeft used for "Назад к лукбукам" link, ArrowLeft/ArrowRight for gallery navigation
import { useLookbookSeasons, useLookbookImages } from "@/hooks/useLookbook";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const LookbookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: seasons, isLoading: seasonsLoading } = useLookbookSeasons();
  const season = seasons?.find(s => s.slug === slug);
  const { data: images, isLoading: imagesLoading } = useLookbookImages(season?.id);
  const [currentPage, setCurrentPage] = useState(0);

  const visibleImages = images?.filter(img => img.is_visible) || [];

  // Группируем изображения по 2 для отображения
  // На последней странице с нечётным количеством показываем последние 2 фото
  const totalImages = visibleImages.length;
  const totalPages = Math.ceil(totalImages / 2);

  const getImagesForPage = (page: number) => {
    const isLastPage = page === totalPages - 1;
    const hasOddCount = totalImages % 2 === 1;

    if (isLastPage && hasOddCount && totalImages > 1) {
      // Последняя страница с нечётным количеством: показываем последние 2 фото
      return visibleImages.slice(-2);
    }

    // Обычная пагинация: по 2 фото на страницу
    return visibleImages.slice(page * 2, page * 2 + 2);
  };

  const currentImages = getImagesForPage(currentPage);

  const goToPrev = () => setCurrentPage(p => Math.max(0, p - 1));
  const goToNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

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
      {/* Кнопка назад */}
      <div className="px-4 md:px-8 pt-4 md:pt-6">
        <Link to="/lookbook" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Назад к лукбукам
        </Link>
      </div>

      {/* Заголовок сверху */}
      {(season.title || season.subtitle) && (
        <div className="px-4 md:px-8 pt-4 md:pt-6">
          {season.title && (
            <h1 className="text-2xl md:text-3xl font-light tracking-wide">
              {season.title}
            </h1>
          )}
          {season.subtitle && (
            <p className="text-base md:text-lg text-muted-foreground mt-2">
              {season.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Основной контент: 2 фото горизонтально + текст справа */}
      {imagesLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : visibleImages.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Изображения скоро появятся</p>
        </div>
      ) : (
        <div className="py-6 md:py-10 px-4 md:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            {/* Grid: 2 фото горизонтально слева, текст справа */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 md:gap-8 items-start">
              {/* Левая колонка: 2 фото горизонтально + навигация */}
              <div className="relative">
                {/* Стрелка влево */}
                {totalPages > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPrev}
                    disabled={currentPage === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full border-gray-300 bg-white/90 text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 disabled:opacity-30"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}

                {/* 2 фото горизонтально (в ряд) */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {currentImages.map((image) => (
                    <div key={image.id} className="aspect-[3/4] overflow-hidden bg-muted">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || season.season_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>

                {/* Стрелка вправо */}
                {totalPages > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNext}
                    disabled={currentPage === totalPages - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full border-gray-300 bg-white/90 text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 disabled:opacity-30"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}

                {/* Индикатор страниц под фото */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPage ? 'bg-foreground' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Правая колонка: описание */}
              <div className="space-y-4">
                {season.description && (
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: season.description }}
                  />
                )}

                {/* Кредит фотографа */}
                {currentImages[0]?.photographer_credit && (
                  <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                    Фотография: {currentImages[0].photographer_credit}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LookbookDetail;
