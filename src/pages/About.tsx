import { useAboutPage } from "@/hooks/useAboutPage";
import { Loader2 } from "lucide-react";

const About = () => {
  const { data: sections, isLoading } = useAboutPage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const getSection = (key: string) => sections?.find((s) => s.section_key === key);

  const brandTitle = getSection("brand_title");
  const desc1 = getSection("description_1");
  const desc2 = getSection("description_2");
  const desc3 = getSection("description_3");
  const philosophy = getSection("philosophy");
  const production = getSection("production");
  const contacts = getSection("contacts");
  const founderImage = getSection("founder_image");

  return (
    <div className="min-h-screen flex items-center py-8 px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <h1 className="text-2xl mb-4 tracking-[0.2em] uppercase">
              {brandTitle?.title || "ANDO JV"}
            </h1>
            
            <div className="space-y-3 text-xs leading-relaxed">
              {desc1?.content && (
                <p className="text-muted-foreground">{desc1.content}</p>
              )}

              {desc2?.content && (
                <p className="text-muted-foreground">{desc2.content}</p>
              )}

              {desc3?.content && (
                <p className="text-muted-foreground">{desc3.content}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              {philosophy && (
                <section>
                  <h2 className="text-sm mb-2 tracking-[0.15em] uppercase">
                    {philosophy.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {philosophy.content}
                  </p>
                </section>
              )}

              {production && (
                <section>
                  <h2 className="text-sm mb-2 tracking-[0.15em] uppercase">
                    {production.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {production.content}
                  </p>
                </section>
              )}
            </div>

            {contacts && (
              <section className="pt-4 border-t border-border">
                <h2 className="text-sm mb-2 tracking-[0.15em] uppercase">
                  {contacts.title}
                </h2>
                <div className="space-y-1 text-xs text-muted-foreground whitespace-pre-line">
                  {contacts.content}
                </div>
              </section>
            )}
          </div>

          {/* Right side - Founder photo */}
          <div>
            <div className="aspect-[3/4] overflow-hidden bg-muted">
              <img
                src={
                  founderImage?.image_url ||
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80"
                }
                alt={founderImage?.title || "Основатели бренда"}
                className="w-full h-full object-cover grayscale"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
