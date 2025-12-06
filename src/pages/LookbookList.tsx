import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useLookbookSeasons } from "@/hooks/useLookbook";
import { useSiteSetting } from "@/hooks/useSiteSettings";

const LookbookList = () => {
  const { data: seasons, isLoading } = useLookbookSeasons();
  const { data: showIntro } = useSiteSetting("lookbook_show_intro");
  const { data: introTitle } = useSiteSetting("lookbook_intro_title");
  const { data: introDescription } = useSiteSetting("lookbook_intro_description");

  const activeSeasons = seasons?.filter(s => s.is_active) || [];
  const shouldShowIntro = showIntro?.value === true;

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full lg:mt-[29px]">
      {shouldShowIntro && (introTitle?.value || introDescription?.value) && (
        <div className="border-b border-border py-12 px-8 text-center max-w-3xl mx-auto">
          {introTitle?.value && (
            <h1 className="text-3xl md:text-4xl font-light mb-4 tracking-wide">
              {introTitle.value as string}
            </h1>
          )}
          {introDescription?.value && (
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              {introDescription.value as string}
            </p>
          )}
        </div>
      )}

      {activeSeasons.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Лукбуки скоро появятся</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-12">
          {activeSeasons.map((season) => (
            <Link
              key={season.id}
              to={`/lookbook/${season.slug}`}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                {season.cover_image_url && (
                  <img
                    src={season.cover_image_url}
                    alt={season.season_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="mt-4 space-y-2">
                <h2 className="text-lg font-medium tracking-wide">
                  {season.season_name}
                </h2>
                {season.short_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {season.short_description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default LookbookList;
