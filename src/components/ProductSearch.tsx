import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

interface ProductSearchProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

const ProductSearch = ({ onSearch, initialValue = "" }: ProductSearchProps) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Call onSearch when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = useCallback(() => {
    setSearchQuery("");
  }, []);

  return (
    <div className="relative flex-1 max-w-md">
      <input
        type="search"
        placeholder="Поиск товаров..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent border-0 border-b border-border px-0 py-2 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
        aria-label="Поиск товаров"
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {searchQuery && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Очистить поиск"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <Search className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
  );
};

export default ProductSearch;
