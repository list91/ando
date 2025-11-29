import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface InfoSectionToggleProps {
  sections: { key: string; label: string }[];
  activeSection: string;
  onSectionChange: (key: string) => void;
}

const InfoSectionToggle = ({ sections, activeSection, onSectionChange }: InfoSectionToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLabel = sections.find(s => s.key === activeSection)?.label || sections[0]?.label || 'Выберите раздел';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (key: string) => {
    onSectionChange(key);
    setIsOpen(false);
  };

  return (
    <div className="relative mb-6 lg:hidden" ref={dropdownRef}>
      {/* Dropdown Button - only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-border bg-muted hover:bg-muted/80 transition-colors min-h-[48px]"
      >
        <span className="text-sm tracking-wide">{activeLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-border bg-background shadow-lg max-h-[60vh] overflow-y-auto">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => handleSelect(section.key)}
              className={`w-full text-left px-4 py-3 text-sm tracking-wide hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                activeSection === section.key ? 'bg-secondary font-medium' : ''
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InfoSectionToggle;
