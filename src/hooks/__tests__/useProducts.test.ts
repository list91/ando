import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper, createTestQueryClient } from '@/__mocks__/react-query';

// Use vi.hoisted to create mocks that are available before module imports
const { mockSupabaseClient, setMockResponse, getChainable, resetChainable } = vi.hoisted(() => {
  // Store for response data
  const responseStore = {
    data: null as any,
    error: null as any,
  };

  const createChainableMock = () => {
    const mock: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(async () => ({
        data: responseStore.data,
        error: responseStore.error,
      })),
      maybeSingle: vi.fn().mockImplementation(async () => ({
        data: responseStore.data,
        error: responseStore.error,
      })),
      then: vi.fn().mockImplementation((resolve) =>
        Promise.resolve({ data: responseStore.data, error: responseStore.error }).then(resolve)
      ),
    };

    return mock;
  };

  const chainableMock = createChainableMock();

  const mockSupabaseClient = {
    from: vi.fn().mockReturnValue(chainableMock),
  };

  const setMockResponse = (data: any, error: any = null) => {
    responseStore.data = data;
    responseStore.error = error;
  };

  const getChainable = () => chainableMock;

  const resetChainable = () => {
    responseStore.data = null;
    responseStore.error = null;
    mockSupabaseClient.from.mockClear();
    Object.keys(chainableMock).forEach((key) => {
      if (typeof chainableMock[key]?.mockClear === 'function') {
        chainableMock[key].mockClear();
      }
    });
  };

  return { mockSupabaseClient, setMockResponse, getChainable, resetChainable };
});

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock sortSizes utility
vi.mock('@/lib/sizeUtils', () => ({
  sortSizes: vi.fn((sizes: string[]) => sizes.sort()),
}));

// Import after mocks are set up
import { useProducts, useProductFilters, useProduct, useCategories, ProductFilters } from '../useProducts';

describe('useProducts', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetChainable();
    // Create fresh query client for each test to prevent caching issues
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useProducts hook', () => {
    it('should fetch products without filters', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          slug: 'product-1',
          price: 100,
          display_order: 1,
          product_images: [{ id: 'img1', image_url: '/img1.jpg', alt_text: 'Alt 1', display_order: 1 }],
        },
        {
          id: '2',
          name: 'Product 2',
          slug: 'product-2',
          price: 200,
          display_order: 2,
          product_images: [],
        },
      ];

      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProducts(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProducts);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
    });

    it('should filter by categoryId', async () => {
      const mockProducts = [{ id: '1', name: 'Category Product', category_id: 'cat-1' }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { categoryId: 'cat-1' };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).toHaveBeenCalledWith('category_id', 'cat-1');
    });

    it('should filter by gender', async () => {
      const mockProducts = [{ id: '1', name: 'Men Product', gender: 'male' }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { gender: 'male' };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).toHaveBeenCalledWith('gender', 'male');
    });

    it('should filter by isSale flag', async () => {
      const mockProducts = [{ id: '1', name: 'Sale Product', is_sale: true }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { isSale: true };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).toHaveBeenCalledWith('is_sale', true);
    });

    it('should filter by isNew flag', async () => {
      const mockProducts = [{ id: '1', name: 'New Product', is_new: true }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { isNew: true };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).toHaveBeenCalledWith('is_new', true);
    });

    it('should filter by minPrice', async () => {
      const mockProducts = [{ id: '1', name: 'Expensive Product', price: 500 }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { minPrice: 100 };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.gte).toHaveBeenCalledWith('price', 100);
    });

    it('should filter by maxPrice', async () => {
      const mockProducts = [{ id: '1', name: 'Cheap Product', price: 50 }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { maxPrice: 200 };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.lte).toHaveBeenCalledWith('price', 200);
    });

    it('should filter by minPrice = 0 (edge case)', async () => {
      const mockProducts = [{ id: '1', name: 'Free Product', price: 0 }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { minPrice: 0 };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.gte).toHaveBeenCalledWith('price', 0);
    });

    it('should filter by maxPrice = 0 (edge case)', async () => {
      const mockProducts: any[] = [];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { maxPrice: 0 };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.lte).toHaveBeenCalledWith('price', 0);
    });

    it('should apply client-side material filter', async () => {
      const mockProducts = [
        { id: '1', name: 'Cotton Product', material: 'cotton' },
        { id: '2', name: 'Silk Product', material: 'silk' },
        { id: '3', name: 'No Material Product', material: null },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { materials: ['cotton'] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].material).toBe('cotton');
    });

    it('should apply client-side color filter', async () => {
      const mockProducts = [
        { id: '1', name: 'Red Product', available_colors: ['red', 'blue'] },
        { id: '2', name: 'Green Product', available_colors: ['green'] },
        { id: '3', name: 'No Color Product', available_colors: null },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { colors: ['red'] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].available_colors).toContain('red');
    });

    it('should apply client-side size filter using size_quantities', async () => {
      const mockProducts = [
        { id: '1', name: 'Product with S', size_quantities: { S: 5, M: 0 }, available_sizes: ['S', 'M'] },
        { id: '2', name: 'Product with M', size_quantities: { M: 3, L: 2 }, available_sizes: ['M', 'L'] },
        { id: '3', name: 'Product with no qty', size_quantities: { S: 0, M: 0 }, available_sizes: ['S', 'M'] },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { sizes: ['S'] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].id).toBe('1');
    });

    it('should fallback to available_sizes when size_quantities is not available', async () => {
      const mockProducts = [
        { id: '1', name: 'Legacy Product', size_quantities: null, available_sizes: ['S', 'M'] },
        { id: '2', name: 'Another Legacy', size_quantities: null, available_sizes: ['L', 'XL'] },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { sizes: ['S'] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].id).toBe('1');
    });

    it('should NOT fallback to available_sizes when size_quantities is empty object (size_quantities takes precedence)', async () => {
      // Note: empty {} is still an object, so size_quantities logic is used, not available_sizes fallback
      // This means products with empty size_quantities will be filtered OUT because no size has qty > 0
      const mockProducts = [
        { id: '1', name: 'Empty Qty Product', size_quantities: {}, available_sizes: ['S', 'M'] },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { sizes: ['S'] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Empty object means size_quantities is used but no sizes have qty > 0
      expect(result.current.data).toHaveLength(0);
    });

    it('should exclude products with no available_sizes in fallback', async () => {
      const mockProducts = [
        { id: '1', name: 'No sizes', size_quantities: null, available_sizes: null },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { sizes: ['S'] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(0);
    });

    it('should apply multiple filters together', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Perfect Match',
          material: 'cotton',
          available_colors: ['red'],
          size_quantities: { S: 5 },
        },
        {
          id: '2',
          name: 'Wrong Material',
          material: 'silk',
          available_colors: ['red'],
          size_quantities: { S: 5 },
        },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = {
        materials: ['cotton'],
        colors: ['red'],
        sizes: ['S'],
      };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].id).toBe('1');
    });

    it('should return empty array when data is null', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => useProducts(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle empty materials filter array', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', material: 'cotton' },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { materials: [] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Empty array should not filter
      expect(result.current.data).toHaveLength(1);
    });

    it('should handle empty colors filter array', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', available_colors: ['red'] },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { colors: [] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
    });

    it('should handle empty sizes filter array', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', size_quantities: { S: 5 } },
      ];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { sizes: [] };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
    });

    it('should throw error when supabase query fails', async () => {
      const mockError = new Error('Database connection failed');
      setMockResponse(null, mockError);

      const { result } = renderHook(() => useProducts(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should not apply isSale filter when false', async () => {
      const mockProducts = [{ id: '1', name: 'Regular Product', is_sale: false }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { isSale: false };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      // isSale false should not call eq
      expect(chainable.eq).not.toHaveBeenCalledWith('is_sale', true);
    });

    it('should not apply isNew filter when false', async () => {
      const mockProducts = [{ id: '1', name: 'Regular Product', is_new: false }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { isNew: false };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).not.toHaveBeenCalledWith('is_new', true);
    });

    it('should handle null categoryId', async () => {
      const mockProducts = [{ id: '1', name: 'Product' }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { categoryId: null };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).not.toHaveBeenCalledWith('category_id', expect.anything());
    });

    it('should handle null gender', async () => {
      const mockProducts = [{ id: '1', name: 'Product' }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { gender: null };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).not.toHaveBeenCalledWith('gender', expect.anything());
    });

    it('should handle undefined minPrice', async () => {
      const mockProducts = [{ id: '1', name: 'Product', price: 100 }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { minPrice: undefined };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.gte).not.toHaveBeenCalled();
    });

    it('should handle undefined maxPrice', async () => {
      const mockProducts = [{ id: '1', name: 'Product', price: 100 }];
      setMockResponse(mockProducts);

      const filters: ProductFilters = { maxPrice: undefined };

      const { result } = renderHook(() => useProducts(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.lte).not.toHaveBeenCalled();
    });
  });

  describe('useProductFilters hook', () => {
    it('should fetch and aggregate filter options', async () => {
      const mockProducts = [
        {
          material: 'cotton',
          available_colors: ['red', 'blue'],
          available_sizes: ['S', 'M'],
          size_quantities: { S: 5, M: 3 },
          price: 100,
        },
        {
          material: 'silk',
          available_colors: ['green'],
          available_sizes: ['L'],
          size_quantities: { L: 2 },
          price: 200,
        },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.materials).toContain('cotton');
      expect(result.current.data?.materials).toContain('silk');
      expect(result.current.data?.colors).toContain('red');
      expect(result.current.data?.colors).toContain('blue');
      expect(result.current.data?.colors).toContain('green');
      expect(result.current.data?.sizes).toContain('S');
      expect(result.current.data?.sizes).toContain('M');
      expect(result.current.data?.sizes).toContain('L');
      expect(result.current.data?.priceRange.min).toBe(100);
      expect(result.current.data?.priceRange.max).toBe(200);
    });

    it('should handle products with null material', async () => {
      const mockProducts = [
        { material: null, available_colors: ['red'], available_sizes: [], size_quantities: {}, price: 100 },
        { material: 'cotton', available_colors: [], available_sizes: [], size_quantities: {}, price: 150 },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.materials).toEqual(['cotton']);
    });

    it('should handle products with null available_colors', async () => {
      const mockProducts = [
        { material: 'cotton', available_colors: null, available_sizes: [], size_quantities: {}, price: 100 },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.colors).toEqual([]);
    });

    it('should only include sizes with quantity > 0 from size_quantities', async () => {
      const mockProducts = [
        {
          material: 'cotton',
          available_colors: [],
          available_sizes: ['S', 'M', 'L'],
          size_quantities: { S: 5, M: 0, L: 3 },
          price: 100,
        },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.sizes).toContain('S');
      expect(result.current.data?.sizes).toContain('L');
      expect(result.current.data?.sizes).not.toContain('M');
    });

    it('should fallback to available_sizes when size_quantities is empty', async () => {
      const mockProducts = [
        {
          material: 'cotton',
          available_colors: [],
          available_sizes: ['S', 'M'],
          size_quantities: {},
          price: 100,
        },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.sizes).toContain('S');
      expect(result.current.data?.sizes).toContain('M');
    });

    it('should fallback to available_sizes when size_quantities is null', async () => {
      const mockProducts = [
        {
          material: 'cotton',
          available_colors: [],
          available_sizes: ['XL', 'XXL'],
          size_quantities: null,
          price: 100,
        },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.sizes).toContain('XL');
      expect(result.current.data?.sizes).toContain('XXL');
    });

    it('should handle null price', async () => {
      const mockProducts = [
        { material: 'cotton', available_colors: [], available_sizes: [], size_quantities: {}, price: null },
        { material: 'silk', available_colors: [], available_sizes: [], size_quantities: {}, price: 100 },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.priceRange.min).toBe(100);
      expect(result.current.data?.priceRange.max).toBe(100);
    });

    it('should return 0 for min price when all prices are null', async () => {
      const mockProducts = [
        { material: 'cotton', available_colors: [], available_sizes: [], size_quantities: {}, price: null },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // minPrice === Infinity means no valid prices, so it returns 0
      expect(result.current.data?.priceRange.min).toBe(0);
      expect(result.current.data?.priceRange.max).toBe(0);
    });

    it('should return empty arrays when no products', async () => {
      setMockResponse([]);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.materials).toEqual([]);
      expect(result.current.data?.colors).toEqual([]);
      expect(result.current.data?.sizes).toEqual([]);
      expect(result.current.data?.priceRange).toEqual({ min: 0, max: 0 });
    });

    it('should throw error when supabase query fails', async () => {
      const mockError = new Error('Failed to fetch filters');
      setMockResponse(null, mockError);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should sort materials alphabetically', async () => {
      const mockProducts = [
        { material: 'silk', available_colors: [], available_sizes: [], size_quantities: {}, price: 100 },
        { material: 'cotton', available_colors: [], available_sizes: [], size_quantities: {}, price: 100 },
        { material: 'wool', available_colors: [], available_sizes: [], size_quantities: {}, price: 100 },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.materials).toEqual(['cotton', 'silk', 'wool']);
    });

    it('should sort colors alphabetically', async () => {
      const mockProducts = [
        { material: null, available_colors: ['red', 'blue', 'green'], available_sizes: [], size_quantities: {}, price: 100 },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.colors).toEqual(['blue', 'green', 'red']);
    });

    it('should handle product with both null available_sizes and empty size_quantities', async () => {
      const mockProducts = [
        { material: 'cotton', available_colors: [], available_sizes: null, size_quantities: {}, price: 100 },
      ];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProductFilters(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.sizes).toEqual([]);
    });
  });

  describe('useProduct hook', () => {
    it('should fetch single product by slug', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        product_images: [{ id: 'img1', image_url: '/img1.jpg', alt_text: 'Alt', display_order: 1 }],
        categories: { id: 'cat1', name: 'Category', slug: 'category' },
      };
      setMockResponse(mockProduct);

      const { result } = renderHook(() => useProduct('test-product'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProduct);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      const chainable = getChainable();
      expect(chainable.eq).toHaveBeenCalledWith('slug', 'test-product');
      expect(chainable.single).toHaveBeenCalled();
    });

    it('should not fetch when slug is empty string', async () => {
      const { result } = renderHook(() => useProduct(''), {
        wrapper,
      });

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when product not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Row not found' };
      setMockResponse(null, mockError);

      const { result } = renderHook(() => useProduct('non-existent'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should handle product with no images', async () => {
      const mockProduct = {
        id: '1',
        name: 'No Images Product',
        slug: 'no-images',
        product_images: [],
        categories: null,
      };
      setMockResponse(mockProduct);

      const { result } = renderHook(() => useProduct('no-images'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.product_images).toEqual([]);
    });

    it('should handle product with no category', async () => {
      const mockProduct = {
        id: '1',
        name: 'Uncategorized Product',
        slug: 'uncategorized',
        product_images: [],
        categories: null,
      };
      setMockResponse(mockProduct);

      const { result } = renderHook(() => useProduct('uncategorized'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.categories).toBeNull();
    });

    it('should re-fetch when slug changes', async () => {
      const mockProduct1 = { id: '1', name: 'Product 1', slug: 'product-1' };
      setMockResponse(mockProduct1);

      const { result, rerender } = renderHook(
        ({ slug }) => useProduct(slug),
        {
          wrapper,
          initialProps: { slug: 'product-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const mockProduct2 = { id: '2', name: 'Product 2', slug: 'product-2' };
      setMockResponse(mockProduct2);

      rerender({ slug: 'product-2' });

      await waitFor(() => {
        expect(result.current.data?.slug).toBe('product-2');
      });
    });
  });

  describe('useCategories hook', () => {
    it('should fetch all categories ordered by display_order', async () => {
      const mockCategories = [
        { id: 'cat1', name: 'Category 1', slug: 'category-1', display_order: 1 },
        { id: 'cat2', name: 'Category 2', slug: 'category-2', display_order: 2 },
        { id: 'cat3', name: 'Category 3', slug: 'category-3', display_order: 3 },
      ];
      setMockResponse(mockCategories);

      const { result } = renderHook(() => useCategories(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCategories);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('categories');
      const chainable = getChainable();
      expect(chainable.select).toHaveBeenCalledWith('*');
      expect(chainable.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should return empty array when no categories', async () => {
      setMockResponse([]);

      const { result } = renderHook(() => useCategories(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should throw error when supabase query fails', async () => {
      const mockError = new Error('Failed to fetch categories');
      setMockResponse(null, mockError);

      const { result } = renderHook(() => useCategories(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should handle categories with null display_order', async () => {
      const mockCategories = [
        { id: 'cat1', name: 'Category 1', slug: 'category-1', display_order: null },
        { id: 'cat2', name: 'Category 2', slug: 'category-2', display_order: 1 },
      ];
      setMockResponse(mockCategories);

      const { result } = renderHook(() => useCategories(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('ProductFilters interface', () => {
    it('should accept all filter combinations', async () => {
      const mockProducts: any[] = [];
      setMockResponse(mockProducts);

      const fullFilters: ProductFilters = {
        categoryId: 'cat-1',
        gender: 'female',
        isSale: true,
        isNew: true,
        materials: ['cotton', 'silk'],
        colors: ['red', 'blue'],
        sizes: ['S', 'M', 'L'],
        minPrice: 50,
        maxPrice: 500,
      };

      const { result } = renderHook(() => useProducts(fullFilters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).toHaveBeenCalledWith('category_id', 'cat-1');
      expect(chainable.eq).toHaveBeenCalledWith('gender', 'female');
      expect(chainable.eq).toHaveBeenCalledWith('is_sale', true);
      expect(chainable.eq).toHaveBeenCalledWith('is_new', true);
      expect(chainable.gte).toHaveBeenCalledWith('price', 50);
      expect(chainable.lte).toHaveBeenCalledWith('price', 500);
    });

    it('should accept empty filters object', async () => {
      const mockProducts = [{ id: '1', name: 'Product' }];
      setMockResponse(mockProducts);

      const emptyFilters: ProductFilters = {};

      const { result } = renderHook(() => useProducts(emptyFilters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
    });

    it('should accept undefined filters', async () => {
      const mockProducts = [{ id: '1', name: 'Product' }];
      setMockResponse(mockProducts);

      const { result } = renderHook(() => useProducts(undefined), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
    });
  });

  describe('Query key generation', () => {
    it('should generate unique query keys for different filters', async () => {
      const mockProducts = [{ id: '1', name: 'Product' }];
      setMockResponse(mockProducts);

      const filters1: ProductFilters = { categoryId: 'cat-1' };
      const filters2: ProductFilters = { categoryId: 'cat-2' };

      const { result: result1 } = renderHook(() => useProducts(filters1), {
        wrapper,
      });

      const { result: result2 } = renderHook(() => useProducts(filters2), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Both queries should have been made (different keys)
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);
    });
  });
});
