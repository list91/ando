import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useLookbookSeasons, useLookbookImages } from "@/hooks/useLookbook";

const Lookbook = () => {
  const { data: seasons, isLoading: seasonsLoading } = useLookbookSeasons();
  const activeSeasons = seasons?.filter(s => s.is_active);
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>();
  const { data: images, isLoading: imagesLoading } = useLookbookImages(
    selectedSeasonId || activeSeasons?.[0]?.id
  );

  // Auto-select first active season
  const currentSeasonId = selectedSeasonId || activeSeasons?.[0]?.id;
  const currentSeason = seasons?.find(s => s.id === currentSeasonId);
  
  // Get photographer credit from first image (they all share the same credit per season)
  const photographerCredit = images?.[0]?.photographer_credit;

  if (seasonsLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!activeSeasons || activeSeasons.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <p className="text-muted-foreground">Сезоны скоро появятся</p>
      </div>
    );
  }

  return (
    <div className="min-h-full lg:mt-[29px]">
      <div className="border-b border-border py-4 px-8 flex justify-end">
        <div className="relative">
          <select
            value={currentSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="appearance-none bg-transparent pr-8 text-sm tracking-wide cursor-pointer focus:outline-none"
          >
            {activeSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                LookBook / {season.season_name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {imagesLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : images && images.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {images.map((image) => (
              <div key={image.id} className="aspect-[3/4] relative overflow-hidden group">
                <img
                  src={image.image_url}
                  alt={`Lookbook ${currentSeason?.season_name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {photographerCredit && (
            <div className="py-16 text-center">
              <p className="text-sm tracking-wide text-muted-foreground">
                Фотография: {photographerCredit}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Изображения скоро появятся</p>
        </div>
      )}
    </div>
  );
};

export default Lookbook;
