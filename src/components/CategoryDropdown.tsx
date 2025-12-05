import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface CategoryDropdownProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Array<{ id: string; name: string }>;
}

const CategoryDropdown = ({ selectedCategory, onCategoryChange, categories }: CategoryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allCategories = [
    { id: "all", name: "Все товары" },
    ...categories
  ];

  const activeLabel = selectedCategory || "Все товары";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (categoryName: string) => {
    onCategoryChange(categoryName);
    setIsOpen(false);
  };

  return (
    <div className="relative lg:hidden" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-border bg-muted hover:bg-muted/80 transition-colors min-h-[48px]"
      >
        <span className="text-sm tracking-wide">{activeLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-border bg-background shadow-lg max-h-[60vh] overflow-y-auto">
          {allCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelect(category.name)}
              className={`w-full text-left px-4 py-3 text-sm tracking-wide hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${selectedCategory === category.name ? "bg-secondary font-medium" : ""}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
