import { describe, it, expect } from 'vitest';
import {
  getOptimizedImageUrl,
  getThumbUrl,
  getMediumUrl,
  getLargeUrl,
} from '../imageUrl';

describe('imageUrl utilities', () => {
  // Test URLs
  const SUPABASE_URL = 'https://example.supabase.co/storage/v1/object/public/images/product.jpg';
  const SUPABASE_URL_WITH_QUERY = 'https://example.supabase.co/storage/v1/object/public/images/product.jpg?t=123';
  const NON_SUPABASE_URL = 'https://cdn.example.com/images/product.jpg';
  const CLOUDINARY_URL = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

  // ========================================
  // getOptimizedImageUrl
  // ========================================
  describe('getOptimizedImageUrl', () => {
    // ========================================
    // EXAMPLE-BASED: Happy path
    // ========================================
    describe('happy path - Supabase URLs', () => {
      it('should transform Supabase URL with thumb quality (50)', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL, 'thumb');
        expect(result).toBe(
          'https://example.supabase.co/storage/v1/render/image/public/images/product.jpg?quality=50'
        );
      });

      it('should transform Supabase URL with medium quality (65)', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL, 'medium');
        expect(result).toBe(
          'https://example.supabase.co/storage/v1/render/image/public/images/product.jpg?quality=65'
        );
      });

      it('should transform Supabase URL with large quality (80)', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL, 'large');
        expect(result).toBe(
          'https://example.supabase.co/storage/v1/render/image/public/images/product.jpg?quality=80'
        );
      });

      it('should default to medium quality when size not specified', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL);
        expect(result).toContain('quality=65');
      });

      it('should handle Supabase URL with existing query parameters', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL_WITH_QUERY, 'thumb');
        expect(result).toBe(
          'https://example.supabase.co/storage/v1/render/image/public/images/product.jpg?t=123&quality=50'
        );
      });

      it('should replace /object/public/ with /render/image/public/', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL, 'medium');
        expect(result).toContain('/render/image/public/');
        expect(result).not.toContain('/object/public/');
      });
    });

    // ========================================
    // Non-Supabase URLs (passthrough)
    // ========================================
    describe('non-Supabase URLs', () => {
      it('should return non-Supabase URL unchanged', () => {
        const result = getOptimizedImageUrl(NON_SUPABASE_URL, 'thumb');
        expect(result).toBe(NON_SUPABASE_URL);
      });

      it('should return Cloudinary URL unchanged', () => {
        const result = getOptimizedImageUrl(CLOUDINARY_URL, 'medium');
        expect(result).toBe(CLOUDINARY_URL);
      });

      it('should return localhost URL unchanged', () => {
        const localUrl = 'http://localhost:3000/images/test.jpg';
        expect(getOptimizedImageUrl(localUrl, 'thumb')).toBe(localUrl);
      });

      it('should return relative URL unchanged', () => {
        const relativeUrl = '/images/product.jpg';
        expect(getOptimizedImageUrl(relativeUrl, 'medium')).toBe(relativeUrl);
      });

      it('should return data URL unchanged', () => {
        const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
        expect(getOptimizedImageUrl(dataUrl, 'thumb')).toBe(dataUrl);
      });

      it('should return blob URL unchanged', () => {
        const blobUrl = 'blob:http://localhost:3000/12345-67890';
        expect(getOptimizedImageUrl(blobUrl, 'medium')).toBe(blobUrl);
      });
    });

    // ========================================
    // BOUNDARY: Empty, null, undefined
    // ========================================
    describe('boundary cases', () => {
      it('should return empty string for empty input', () => {
        expect(getOptimizedImageUrl('', 'thumb')).toBe('');
      });

      it('should return empty string for empty input without size param', () => {
        expect(getOptimizedImageUrl('')).toBe('');
      });

      it('should handle URL with only domain (no path)', () => {
        const urlNoPAth = 'https://example.supabase.co';
        expect(getOptimizedImageUrl(urlNoPAth, 'thumb')).toBe(urlNoPAth);
      });
    });

    // ========================================
    // EDGE CASES
    // ========================================
    describe('edge cases', () => {
      it('should handle URL with multiple query parameters', () => {
        const urlWithParams = 'https://example.supabase.co/storage/v1/object/public/images/product.jpg?t=123&v=456';
        const result = getOptimizedImageUrl(urlWithParams, 'thumb');
        expect(result).toContain('?t=123&v=456&quality=50');
      });

      it('should handle deeply nested path', () => {
        const nestedUrl = 'https://example.supabase.co/storage/v1/object/public/bucket/folder1/folder2/folder3/image.jpg';
        const result = getOptimizedImageUrl(nestedUrl, 'medium');
        expect(result).toContain('/render/image/public/bucket/folder1/folder2/folder3/image.jpg');
        expect(result).toContain('quality=65');
      });

      it('should handle URL with special characters in filename', () => {
        const specialUrl = 'https://example.supabase.co/storage/v1/object/public/images/product%20image%20(1).jpg';
        const result = getOptimizedImageUrl(specialUrl, 'thumb');
        expect(result).toContain('product%20image%20(1).jpg');
        expect(result).toContain('quality=50');
      });

      it('should handle URL with hash fragment', () => {
        const hashUrl = 'https://example.supabase.co/storage/v1/object/public/images/product.jpg#section';
        const result = getOptimizedImageUrl(hashUrl, 'medium');
        expect(result).toContain('quality=65');
      });

      it('should handle different Supabase project URLs', () => {
        const differentProject = 'https://xyzproject.supabase.co/storage/v1/object/public/mybucket/photo.png';
        const result = getOptimizedImageUrl(differentProject, 'large');
        expect(result).toBe(
          'https://xyzproject.supabase.co/storage/v1/render/image/public/mybucket/photo.png?quality=80'
        );
      });

      it('should handle Supabase URL with uppercase letters', () => {
        const upperUrl = 'https://Example.Supabase.co/storage/v1/object/public/images/Product.JPG';
        // Should not match because case-sensitive check
        expect(getOptimizedImageUrl(upperUrl, 'thumb')).toBe(upperUrl);
      });

      it('should handle URL that contains supabase.co but not in storage path', () => {
        const blogUrl = 'https://supabase.co/blog/images/post.jpg';
        expect(getOptimizedImageUrl(blogUrl, 'medium')).toBe(blogUrl);
      });

      it('should transform URL with supabase.co/storage pattern in query params (includes check limitation)', () => {
        // Note: The includes() check matches the pattern even in query params
        // This is a known limitation of the simple string check
        const trickUrl = 'https://cdn.com/image.jpg?ref=supabase.co/storage/v1/object/public/';
        const result = getOptimizedImageUrl(trickUrl, 'thumb');
        // The function transforms this because it contains the pattern
        expect(result).toContain('/render/image/public/');
        expect(result).toContain('quality=50');
      });
    });

    // ========================================
    // Quality values verification
    // ========================================
    describe('quality values', () => {
      it('should use quality=50 for thumb', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL, 'thumb');
        expect(result).toMatch(/quality=50$/);
      });

      it('should use quality=65 for medium', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL, 'medium');
        expect(result).toMatch(/quality=65$/);
      });

      it('should use quality=80 for large', () => {
        const result = getOptimizedImageUrl(SUPABASE_URL, 'large');
        expect(result).toMatch(/quality=80$/);
      });
    });
  });

  // ========================================
  // getThumbUrl
  // ========================================
  describe('getThumbUrl', () => {
    it('should call getOptimizedImageUrl with thumb size', () => {
      const result = getThumbUrl(SUPABASE_URL);
      expect(result).toContain('quality=50');
    });

    it('should return empty string for empty input', () => {
      expect(getThumbUrl('')).toBe('');
    });

    it('should return non-Supabase URL unchanged', () => {
      expect(getThumbUrl(NON_SUPABASE_URL)).toBe(NON_SUPABASE_URL);
    });

    it('should transform Supabase URL correctly', () => {
      const result = getThumbUrl(SUPABASE_URL);
      expect(result).toBe(
        'https://example.supabase.co/storage/v1/render/image/public/images/product.jpg?quality=50'
      );
    });
  });

  // ========================================
  // getMediumUrl
  // ========================================
  describe('getMediumUrl', () => {
    it('should call getOptimizedImageUrl with medium size', () => {
      const result = getMediumUrl(SUPABASE_URL);
      expect(result).toContain('quality=65');
    });

    it('should return empty string for empty input', () => {
      expect(getMediumUrl('')).toBe('');
    });

    it('should return non-Supabase URL unchanged', () => {
      expect(getMediumUrl(NON_SUPABASE_URL)).toBe(NON_SUPABASE_URL);
    });

    it('should transform Supabase URL correctly', () => {
      const result = getMediumUrl(SUPABASE_URL);
      expect(result).toBe(
        'https://example.supabase.co/storage/v1/render/image/public/images/product.jpg?quality=65'
      );
    });
  });

  // ========================================
  // getLargeUrl
  // ========================================
  describe('getLargeUrl', () => {
    it('should call getOptimizedImageUrl with large size', () => {
      const result = getLargeUrl(SUPABASE_URL);
      expect(result).toContain('quality=80');
    });

    it('should return empty string for empty input', () => {
      expect(getLargeUrl('')).toBe('');
    });

    it('should return non-Supabase URL unchanged', () => {
      expect(getLargeUrl(NON_SUPABASE_URL)).toBe(NON_SUPABASE_URL);
    });

    it('should transform Supabase URL correctly', () => {
      const result = getLargeUrl(SUPABASE_URL);
      expect(result).toBe(
        'https://example.supabase.co/storage/v1/render/image/public/images/product.jpg?quality=80'
      );
    });
  });

  // ========================================
  // REAL-WORLD SCENARIOS
  // ========================================
  describe('real-world scenarios', () => {
    it('should optimize product catalog thumbnail', () => {
      const productImage = 'https://project.supabase.co/storage/v1/object/public/products/sku-12345/main.jpg';
      const thumb = getThumbUrl(productImage);
      expect(thumb).toContain('/render/image/public/');
      expect(thumb).toContain('quality=50');
    });

    it('should optimize product detail page image', () => {
      const productImage = 'https://project.supabase.co/storage/v1/object/public/products/sku-12345/gallery-1.jpg';
      const medium = getMediumUrl(productImage);
      expect(medium).toContain('quality=65');
    });

    it('should optimize zoom/fullscreen image', () => {
      const productImage = 'https://project.supabase.co/storage/v1/object/public/products/sku-12345/highres.jpg';
      const large = getLargeUrl(productImage);
      expect(large).toContain('quality=80');
    });

    it('should handle image with cache-busting timestamp', () => {
      const imageWithTimestamp = 'https://project.supabase.co/storage/v1/object/public/products/item.jpg?t=1704067200';
      const result = getThumbUrl(imageWithTimestamp);
      expect(result).toContain('t=1704067200');
      expect(result).toContain('quality=50');
    });

    it('should fallback gracefully for CDN-served images', () => {
      const cdnImage = 'https://cdn.ando.ru/images/product-123.jpg';
      expect(getThumbUrl(cdnImage)).toBe(cdnImage);
      expect(getMediumUrl(cdnImage)).toBe(cdnImage);
      expect(getLargeUrl(cdnImage)).toBe(cdnImage);
    });
  });
});
