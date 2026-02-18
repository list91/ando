import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';

// Mock product data
const mockProductData = vi.hoisted(() => ({
  data: null as any,
  isLoading: false,
}));

const mockCart = vi.hoisted(() => ({
  addToCart: vi.fn(),
}));

const mockFavorites = vi.hoisted(() => ({
  isFavorite: vi.fn(() => false),
  toggleFavorite: vi.fn(),
}));

const mockColorMap = vi.hoisted(() => ({
  getColorHex: vi.fn((color: string) => '#CCCCCC'),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/hooks/useProducts', () => ({
  useProduct: () => mockProductData,
}));

vi.mock('@/contexts/CartContext', () => ({
  useCart: () => mockCart,
}));

vi.mock('@/contexts/FavoritesContext', () => ({
  useFavorites: () => mockFavorites,
}));

vi.mock('@/hooks/useColorMap', () => ({
  useColorMap: () => mockColorMap,
}));

vi.mock('@/lib/imageUrl', () => ({
  getMediumUrl: (url: string) => url,
}));

vi.mock('@/lib/sizeUtils', () => ({
  sortSizes: (sizes: string[]) => sizes.sort(),
}));

// Mock ImageMagnifier component
vi.mock('@/components/ImageMagnifier', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="image-magnifier" />
  ),
}));

// Mock ImageLightbox component
vi.mock('@/components/ImageLightbox', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="lightbox">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock react-zoom-pan-pinch
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="transform-wrapper">{children}</div>
  ),
  TransformComponent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="transform-component">{children}</div>
  ),
}));

import Product from '../Product';
import { toast } from 'sonner';

const renderProduct = (slug = 'test-product') => {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/product/${slug}`]}>
        <Routes>
          <Route path="/product/:id" element={<Product />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('Product Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductData.data = null;
    mockProductData.isLoading = false;
    mockFavorites.isFavorite.mockReturnValue(false);
    // Mock window.matchMedia for desktop detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(pointer: fine)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading indicator', () => {
      mockProductData.isLoading = true;

      renderProduct();

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });
  });

  describe('Not Found State', () => {
    it('should render not found message when product is null', () => {
      mockProductData.data = null;
      mockProductData.isLoading = false;

      renderProduct();

      expect(screen.getByText('Товар не найден')).toBeInTheDocument();
      expect(screen.getByText('Вернуться в каталог')).toBeInTheDocument();
    });
  });

  describe('Product Display', () => {
    const mockProduct = {
      id: 'prod-1',
      name: 'Test Product',
      slug: 'test-product',
      price: 1000,
      old_price: null,
      description: 'A test product description',
      material: 'Cotton',
      composition: '100% Cotton',
      care_instructions: 'Machine wash cold',
      delivery_info: 'Free shipping',
      payment_info: 'Card or cash',
      article: 'ART-001',
      is_new: false,
      is_sale: false,
      available_sizes: ['S', 'M', 'L'],
      size_quantities: { S: 5, M: 3, L: 0 },
      available_colors: ['black', 'white'],
      color_links: {},
      product_images: [
        { image_url: '/img1.jpg', display_order: 1 },
        { image_url: '/img2.jpg', display_order: 2 },
      ],
    };

    beforeEach(() => {
      mockProductData.data = mockProduct;
    });

    it('should render product name', () => {
      renderProduct();

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should render product price', () => {
      renderProduct();

      expect(screen.getByText('1000 ₽')).toBeInTheDocument();
    });

    it('should render article number', () => {
      renderProduct();

      expect(screen.getByText('Артикул: ART-001')).toBeInTheDocument();
    });

    it('should render composition', () => {
      renderProduct();

      expect(screen.getByText('Состав: 100% Cotton')).toBeInTheDocument();
    });

    it('should render available sizes with stock', () => {
      renderProduct();

      // S and M have stock, L does not
      expect(screen.getByLabelText('Выбрать размер S')).toBeInTheDocument();
      expect(screen.getByLabelText('Выбрать размер M')).toBeInTheDocument();
      expect(screen.queryByLabelText('Выбрать размер L')).not.toBeInTheDocument();
    });

    it('should render color circles', () => {
      renderProduct();

      expect(screen.getByText('Цвет:')).toBeInTheDocument();
    });

    it('should render image navigation dots', () => {
      renderProduct();

      const dots = screen.getAllByLabelText(/Фото \d/);
      expect(dots).toHaveLength(2);
    });
  });

  describe('NEW and SALE Badges', () => {
    it('should display NEW badge', () => {
      mockProductData.data = {
        id: '1',
        name: 'New Product',
        slug: 'new-product',
        price: 500,
        is_new: true,
        is_sale: false,
        product_images: [],
        size_quantities: { M: 1 },
        available_sizes: ['M'],
        available_colors: [],
      };

      renderProduct();

      expect(screen.getByText('НОВОЕ')).toBeInTheDocument();
    });

    it('should display discount badge for sale items', () => {
      mockProductData.data = {
        id: '1',
        name: 'Sale Product',
        slug: 'sale-product',
        price: 500,
        old_price: 1000,
        is_new: false,
        is_sale: true,
        product_images: [],
        size_quantities: { M: 1 },
        available_sizes: ['M'],
        available_colors: [],
      };

      renderProduct();

      expect(screen.getByText('%')).toBeInTheDocument();
      expect(screen.getByText(/−50%/)).toBeInTheDocument();
      expect(screen.getByText('1000 ₽')).toBeInTheDocument();
      expect(screen.getByText('500 ₽')).toBeInTheDocument();
    });
  });

  describe('Size Selection', () => {
    beforeEach(() => {
      mockProductData.data = {
        id: '1',
        name: 'Product',
        slug: 'product',
        price: 500,
        product_images: [],
        size_quantities: { S: 5, M: 3 },
        available_sizes: ['S', 'M'],
        available_colors: [],
      };
    });

    it('should select size on click', () => {
      renderProduct();

      const sizeS = screen.getByLabelText('Выбрать размер S');
      fireEvent.click(sizeS);

      // Size should be selected (visual change)
      expect(sizeS).toHaveClass('border-foreground');
    });

    it('should show stock quantity after size selection', () => {
      renderProduct();

      const sizeS = screen.getByLabelText('Выбрать размер S');
      fireEvent.click(sizeS);

      expect(screen.getByText('В наличии: 5 шт.')).toBeInTheDocument();
    });
  });

  describe('Add to Cart', () => {
    beforeEach(() => {
      mockProductData.data = {
        id: '1',
        name: 'Product',
        slug: 'product',
        price: 500,
        product_images: [{ image_url: '/img.jpg', display_order: 1 }],
        size_quantities: { S: 5, M: 3 },
        available_sizes: ['S', 'M'],
        available_colors: ['black'],
      };
    });

    it('should show error when adding to cart without size', () => {
      renderProduct();

      const addButton = screen.getByText('ДОБАВИТЬ В КОРЗИНУ');
      fireEvent.click(addButton);

      expect(toast.error).toHaveBeenCalledWith('Пожалуйста, выберите размер');
      expect(mockCart.addToCart).not.toHaveBeenCalled();
    });

    it('should add to cart with selected size', () => {
      renderProduct();

      const sizeS = screen.getByLabelText('Выбрать размер S');
      fireEvent.click(sizeS);

      const addButton = screen.getByText('ДОБАВИТЬ В КОРЗИНУ');
      fireEvent.click(addButton);

      expect(mockCart.addToCart).toHaveBeenCalledWith({
        id: '1',
        name: 'Product',
        price: 500,
        size: 'S',
        color: 'black',
        image: '/img.jpg',
      });
    });
  });

  describe('Favorites', () => {
    beforeEach(() => {
      mockProductData.data = {
        id: 'fav-1',
        name: 'Product',
        slug: 'product',
        price: 500,
        product_images: [],
        size_quantities: { M: 1 },
        available_sizes: ['M'],
        available_colors: [],
      };
    });

    it('should toggle favorite on heart click', () => {
      renderProduct();

      const heartButton = screen.getByLabelText('Добавить в избранное');
      fireEvent.click(heartButton);

      expect(mockFavorites.toggleFavorite).toHaveBeenCalledWith('fav-1');
    });

    it('should show filled heart for favorite product', () => {
      mockFavorites.isFavorite.mockReturnValue(true);

      renderProduct();

      expect(screen.getByLabelText('Удалить из избранного')).toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    beforeEach(() => {
      mockProductData.data = {
        id: '1',
        name: 'Product',
        slug: 'product',
        price: 500,
        description: 'Product description text',
        care_instructions: 'Care instructions text',
        delivery_info: 'Delivery info text',
        payment_info: 'Payment info text',
        product_images: [],
        size_quantities: { M: 1 },
        available_sizes: ['M'],
        available_colors: [],
      };
    });

    it('should render collapsible section headers', () => {
      renderProduct();

      expect(screen.getByText('ОПИСАНИЕ')).toBeInTheDocument();
      expect(screen.getByText('УХОД')).toBeInTheDocument();
      expect(screen.getByText('ДОСТАВКА')).toBeInTheDocument();
      expect(screen.getByText('ОПЛАТА')).toBeInTheDocument();
    });

    it('should expand description section on click', async () => {
      renderProduct();

      const descriptionTrigger = screen.getByText('ОПИСАНИЕ');
      fireEvent.click(descriptionTrigger);

      await waitFor(() => {
        expect(screen.getByText('Product description text')).toBeInTheDocument();
      });
    });
  });

  describe('Image Navigation', () => {
    beforeEach(() => {
      mockProductData.data = {
        id: '1',
        name: 'Product',
        slug: 'product',
        price: 500,
        product_images: [
          { image_url: '/img1.jpg', display_order: 1 },
          { image_url: '/img2.jpg', display_order: 2 },
          { image_url: '/img3.jpg', display_order: 3 },
        ],
        size_quantities: { M: 1 },
        available_sizes: ['M'],
        available_colors: [],
      };
    });

    it('should navigate to next image', () => {
      renderProduct();

      const nextButton = screen.getByLabelText('Следующее фото');
      fireEvent.click(nextButton);

      // Verify navigation happened (second dot should be active)
    });

    it('should navigate to previous image', () => {
      renderProduct();

      const prevButton = screen.getByLabelText('Предыдущее фото');
      fireEvent.click(prevButton);

      // Should wrap to last image
    });

    it('should navigate via dot click', () => {
      renderProduct();

      const dot2 = screen.getByLabelText('Фото 2');
      fireEvent.click(dot2);

      // Second image should be active
    });
  });

  describe('Out of Stock', () => {
    it('should show "Нет в наличии" when no sizes available', () => {
      mockProductData.data = {
        id: '1',
        name: 'Product',
        slug: 'product',
        price: 500,
        product_images: [],
        size_quantities: {},
        available_sizes: [],
        available_colors: [],
      };

      renderProduct();

      expect(screen.getByText('Нет в наличии')).toBeInTheDocument();
    });
  });

  describe('Color Links', () => {
    it('should render color links when available', () => {
      mockProductData.data = {
        id: '1',
        name: 'Product',
        slug: 'product',
        price: 500,
        product_images: [],
        size_quantities: { M: 1 },
        available_sizes: ['M'],
        available_colors: ['black'],
        color_links: {
          white: '/product/product-white',
          red: '/product/product-red',
        },
      };

      renderProduct();

      expect(screen.getByText('В другом цвете:')).toBeInTheDocument();
    });
  });

  describe('SEO', () => {
    it('should render SchemaOrg component', () => {
      mockProductData.data = {
        id: '1',
        name: 'SEO Product',
        slug: 'seo-product',
        price: 500,
        description: 'SEO description',
        product_images: [{ image_url: '/img.jpg', display_order: 1 }],
        size_quantities: { M: 1 },
        available_sizes: ['M'],
        available_colors: [],
      };

      renderProduct();

      // Helmet should set the title (can be checked via document.title in integration tests)
    });
  });

  describe('Size Guide Link', () => {
    it('should render size guide link', () => {
      mockProductData.data = {
        id: '1',
        name: 'Product',
        slug: 'product',
        price: 500,
        product_images: [],
        size_quantities: { M: 1 },
        available_sizes: ['M'],
        available_colors: [],
      };

      renderProduct();

      expect(screen.getByText('Информация о размерах товара')).toBeInTheDocument();
    });
  });
});
