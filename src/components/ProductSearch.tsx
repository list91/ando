import { Search, X } from "lucide-react";
import { useCatalogSearch } from "@/contexts/CatalogSearchContext";

const ProductSearch = () => {
  const { query, setQuery, clearQuery } = useCatalogSearch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    clearQuery();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      clearQuery();
    }
  };

  return (
    <div className="relative w-full" role="search">
      <input
        type="text"
        placeholder=""
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label="Поиск товаров"
        className="w-full bg-transparent border-0 border-b border-border px-2 py-2 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground text-center"
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {query && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Очистить поиск"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <Search className="w-4 h-4 text-muted-foreground opacity-60" aria-hidden="true" />
      </div>
    </div>
  );
};

export default ProductSearch;
