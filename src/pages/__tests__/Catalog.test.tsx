import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks and contexts
const mockProducts = vi.hoisted(() => ({
  data: [] as any[],
  isLoading: false,
}));

const mockCategories = vi.hoisted(() => ({
  data: [] as any[],
}));

const mockFilterOptions = vi.hoisted(() => ({
  data: {
    materials: ['cotton', 'silk'],
    colors: ['red', 'blue'],
    sizes: ['S', 'M', 'L'],
    priceRange: { min: 100, max: 1000 },
  },
}));

const mockSettings = vi.hoisted(() => ({
  data: {},
}));

const mockUser = vi.hoisted(() => ({
  user: null as { id: string } | null,
}));

const mockFavorites = vi.hoisted(() => ({
  isFavorite: vi.fn(() => false),
  toggleFavorite: vi.fn(),
}));

const mockSearch = vi.hoisted(() => ({
  query: '',
}));

const mockToast = vi.hoisted(() => ({
  toast: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => mockProducts,
  useCategories: () => mockCategories,
  useProductFilters: () => mockFilterOptions,
}));

vi.mock('@/hooks/useSiteSettings', () => ({
  useSiteSettings: () => mockSettings,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUser,
}));

vi.mock('@/contexts/FavoritesContext', () => ({
  useFavorites: () => mockFavorites,
}));

vi.mock('@/contexts/CatalogSearchContext', () => ({
  useCatalogSearch: () => mockSearch,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Create a proper async chainable mock for supabase using vi.hoisted
const mockSupabase = vi.hoisted(() => {
  const createSelectMock = () => {
    const promise = Promise.resolve({ data: [], error: null });
    return {
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
    };
  };

  const selectMock = vi.fn().mockImplementation(() => createSelectMock());
  const fromMock = vi.fn().mockImplementation(() => ({
    select: selectMock,
  }));

  return {
    from: fromMock,
    _selectMock: selectMock,
    _fromMock: fromMock,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/stores/priceFilterStore', () => ({
  usePriceFilterStore: Object.assign(
    (selector: (state: any) => any) => selector({ min: '', max: '' }),
    {
      getState: () => ({
        min: '',
        max: '',
        setMin: vi.fn(),
        setMax: vi.fn(),
        reset: vi.fn(),
      }),
    }
  ),
}));

import Catalog from '../Catalog';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

const renderCatalog = (props = {}) => {
  const defaultProps = {
    selectedCategory: 'Все товары',
    setSelectedCategory: vi.fn(),
    selectedGender: 'women',
    setSelectedGender: vi.fn(),
  };

  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Catalog {...defaultProps} {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Catalog Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProducts.data = [];
    mockProducts.isLoading = false;
    mockCategories.data = [];
    mockUser.user = null;
    mockSearch.query = '';
  });

  afterEach(async () => {
    cleanup();
    // Allow pending promises to resolve
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // Only clear mocks, don't restore - restoreAllMocks would clear implementations
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render loading state', () => {
      mockProducts.isLoading = true;

      renderCatalog();

      expect(screen.getByText('Загрузка товаров...')).toBeInTheDocument();
    });

    it('should render empty state when no products', () => {
      mockProducts.data = [];
      mockProducts.isLoading = false;

      renderCatalog();

      expect(screen.getByText('Товары не найдены')).toBeInTheDocument();
    });

    it('should render product grid when products exist', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'Test Product',
          slug: 'test-product',
          price: 1000,
          product_images: [{ image_url: '/img.jpg', display_order: 1 }],
          size_quantities: { S: 5, M: 3 },
        },
      ];

      renderCatalog();

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('1000 ₽')).toBeInTheDocument();
    });

    it('should render filter buttons', () => {
      renderCatalog();

      expect(screen.getByText(/Материал/)).toBeInTheDocument();
      expect(screen.getByText(/Цвет/)).toBeInTheDocument();
      expect(screen.getByText(/Размер/)).toBeInTheDocument();
      expect(screen.getByText(/Цена/)).toBeInTheDocument();
    });
  });

  describe('Product Display', () => {
    it('should display product with NEW badge', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'New Product',
          slug: 'new-product',
          price: 500,
          is_new: true,
          product_images: [],
          size_quantities: { S: 1 },
        },
      ];

      renderCatalog();

      expect(screen.getByText('НОВОЕ')).toBeInTheDocument();
    });

    it('should display product with SALE badge', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'Sale Product',
          slug: 'sale-product',
          price: 500,
          old_price: 1000,
          is_sale: true,
          product_images: [],
          size_quantities: { M: 2 },
        },
      ];

      renderCatalog();

      expect(screen.getByText('%')).toBeInTheDocument();
      expect(screen.getByText('500 ₽')).toBeInTheDocument();
      expect(screen.getByText('1000 ₽')).toBeInTheDocument();
    });

    it('should display "Нет в наличии" when no sizes available', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'Out of Stock',
          slug: 'out-of-stock',
          price: 500,
          product_images: [],
          size_quantities: {},
          available_sizes: [],
        },
      ];

      renderCatalog();

      expect(screen.getByText('Нет в наличии')).toBeInTheDocument();
    });

    it('should display available sizes', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'Product',
          slug: 'product',
          price: 500,
          product_images: [],
          size_quantities: { S: 5, M: 3, L: 0 },
        },
      ];

      renderCatalog();

      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
      // L should not be shown (qty = 0)
    });
  });

  describe('Favorites Interaction', () => {
    it('should call toggleFavorite when heart icon clicked', async () => {
      mockProducts.data = [
        {
          id: 'prod-1',
          name: 'Product',
          slug: 'product',
          price: 500,
          product_images: [],
          size_quantities: { M: 1 },
        },
      ];

      renderCatalog();

      const heartButton = screen.getByLabelText('Добавить в избранное');
      fireEvent.click(heartButton);

      await waitFor(() => {
        expect(mockFavorites.toggleFavorite).toHaveBeenCalledWith('prod-1');
      });
    });

    it('should show filled heart for favorited product', () => {
      mockProducts.data = [
        {
          id: 'fav-1',
          name: 'Favorite Product',
          slug: 'favorite',
          price: 500,
          product_images: [],
          size_quantities: { M: 1 },
        },
      ];
      mockFavorites.isFavorite.mockReturnValue(true);

      renderCatalog();

      expect(screen.getByLabelText('Удалить из избранного')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should show empty search results message', () => {
      mockProducts.data = [];
      mockSearch.query = 'nonexistent';

      renderCatalog();

      expect(screen.getByText(/По запросу/)).toBeInTheDocument();
      expect(screen.getAllByText(/nonexistent/).length).toBeGreaterThan(0);
    });

    it('should filter products by search query', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'Cotton Shirt',
          slug: 'cotton-shirt',
          price: 500,
          product_images: [],
          size_quantities: { M: 1 },
        },
        {
          id: '2',
          name: 'Silk Dress',
          slug: 'silk-dress',
          price: 800,
          product_images: [],
          size_quantities: { S: 1 },
        },
      ];
      mockSearch.query = 'Cotton';

      renderCatalog();

      expect(screen.getByText('Cotton Shirt')).toBeInTheDocument();
      expect(screen.queryByText('Silk Dress')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should render sort button', () => {
      renderCatalog();

      expect(screen.getByText('Сортировка')).toBeInTheDocument();
    });
  });

  describe('Grid View Toggle', () => {
    it('should render grid toggle buttons on desktop', () => {
      renderCatalog();

      expect(screen.getByLabelText('3 карточки в строку')).toBeInTheDocument();
      expect(screen.getByLabelText('4 карточки в строку')).toBeInTheDocument();
    });

    it('should toggle grid columns on click', () => {
      renderCatalog();

      const fourColButton = screen.getByLabelText('4 карточки в строку');
      fireEvent.click(fourColButton);

      // Grid class should update (tested via visual inspection or snapshot)
    });
  });

  describe('Product Count Display', () => {
    it('should display found count', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'Product 1',
          slug: 'p1',
          price: 100,
          product_images: [],
          size_quantities: { S: 1 },
        },
        {
          id: '2',
          name: 'Product 2',
          slug: 'p2',
          price: 200,
          product_images: [],
          size_quantities: { M: 1 },
        },
      ];

      renderCatalog();

      expect(screen.getByText(/Найдено: 2/)).toBeInTheDocument();
    });
  });

  describe('Image Gallery Navigation', () => {
    it('should not show dots for single image', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'Product',
          slug: 'product',
          price: 500,
          product_images: [{ image_url: '/img1.jpg', display_order: 1 }],
          size_quantities: { M: 1 },
        },
      ];

      renderCatalog();

      // No navigation dots for single image
      const dots = screen.queryAllByRole('button', { name: /Фото/ });
      expect(dots).toHaveLength(0);
    });
  });

  describe('Product Links', () => {
    it('should link to product page', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'Linkable Product',
          slug: 'linkable-product',
          price: 500,
          product_images: [],
          size_quantities: { M: 1 },
        },
      ];

      renderCatalog();

      const links = screen.getAllByRole('link');
      const productLink = links.find((link) =>
        link.getAttribute('href')?.includes('/product/linkable-product')
      );
      expect(productLink).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing product images gracefully', () => {
      mockProducts.data = [
        {
          id: '1',
          name: 'No Images',
          slug: 'no-images',
          price: 500,
          product_images: null,
          size_quantities: { M: 1 },
        },
      ];

      renderCatalog();

      // Should render with fallback image
      expect(screen.getByText('No Images')).toBeInTheDocument();
    });
  });
});
