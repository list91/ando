import { Button } from "@/components/ui/button";

interface InfoSectionToggleProps {
  sections: { key: string; label: string }[];
  activeSection: string;
  onSectionChange: (key: string) => void;
}

const InfoSectionToggle = ({ sections, activeSection, onSectionChange }: InfoSectionToggleProps) => {
  return (
    <div className="flex lg:hidden flex-wrap gap-2 mb-6 border-b border-border pb-4">
      {sections.map((section) => (
        <Button
          key={section.key}
          variant={activeSection === section.key ? "default" : "outline"}
          onClick={() => onSectionChange(section.key)}
          className="text-xs min-h-[44px] px-4"
        >
          {section.label}
        </Button>
      ))}
    </div>
  );
};

export default InfoSectionToggle;
