import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface CatalogSearchState {
  query: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface CatalogSearchContextType {
  query: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  setQuery: (q: string) => void;
  clearQuery: () => void;
  search: () => void;
}

const CatalogSearchContext = createContext<CatalogSearchContextType | undefined>(undefined);

export const CatalogSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<CatalogSearchState>({
    query: searchParams.get('search') || '',
    status: 'idle',
  });
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync with URL on mount
  useEffect(() => {
    const urlQuery = searchParams.get('search') || '';
    if (urlQuery !== state.query) {
      setState(prev => ({ ...prev, query: urlQuery }));
    }
  }, []); // Only on mount

  // Update URL when query changes (debounced)
  const updateURL = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Set query with debounced URL update
  const setQuery = useCallback((q: string) => {
    setState(prev => ({ ...prev, query: q }));

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce URL update
    debounceTimerRef.current = setTimeout(() => {
      updateURL(q);
    }, 300);
  }, [updateURL]);

  // Clear query and reset filters
  const clearQuery = useCallback(() => {
    setState({ query: '', status: 'idle' });
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Remove from URL immediately
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Trigger search (for future use if needed)
  const search = useCallback(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, status: 'loading' }));
    
    // In this implementation, filtering is done in Catalog component
    // This is just to manage state
    requestAnimationFrame(() => {
      setState(prev => ({ ...prev, status: 'success' }));
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <CatalogSearchContext.Provider
      value={{
        query: state.query,
        status: state.status,
        setQuery,
        clearQuery,
        search,
      }}
    >
      {children}
    </CatalogSearchContext.Provider>
  );
};

export const useCatalogSearch = () => {
  const context = useContext(CatalogSearchContext);
  if (!context) {
    throw new Error('useCatalogSearch must be used within CatalogSearchProvider');
  }
  return context;
};
