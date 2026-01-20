import { useAboutPage } from "@/hooks/useAboutPage";
import { Loader2 } from "lucide-react";

const About = () => {
  const { data: sections, isLoading } = useAboutPage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const brandTitle = sections?.find((s) => s.section_key === "brand_title");
  const descriptions = sections?.filter((s) => s.section_key.startsWith("description_"));
  const philosophy = sections?.find((s) => s.section_key === "philosophy");
  const production = sections?.find((s) => s.section_key === "production");
  const contacts = sections?.find((s) => s.section_key === "contacts");
  const founderImage = sections?.find((s) => s.section_key === "founder_image");

  return (
    <div className="min-h-screen py-8 px-8 lg:mt-[29px]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <h1 className="text-2xl mb-4 tracking-[0.2em] uppercase">
              {brandTitle?.title || "ANDO JV"}
            </h1>
            
            <div className="space-y-3 text-xs leading-relaxed">
              {descriptions?.map((desc) => (
                <p key={desc.id} className="text-muted-foreground">
                  {desc.content}
                </p>
              ))}
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
                src={founderImage?.image_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80"}
                alt={founderImage?.title || "Основатели бренда"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
