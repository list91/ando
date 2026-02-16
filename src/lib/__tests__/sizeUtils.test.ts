import { describe, it, expect } from 'vitest';
import { SIZE_ORDER, sortSizes } from '../sizeUtils';

describe('sizeUtils', () => {
  // ========================================
  // SIZE_ORDER constant
  // ========================================
  describe('SIZE_ORDER', () => {
    it('should contain letter sizes in correct order', () => {
      const letterSizes = SIZE_ORDER.slice(0, 7);
      expect(letterSizes).toEqual(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']);
    });

    it('should contain number sizes in correct order', () => {
      const numberSizes = SIZE_ORDER.slice(7);
      expect(numberSizes).toEqual(['40', '42', '44', '46', '48', '50', '52']);
    });

    it('should have 14 total sizes', () => {
      expect(SIZE_ORDER).toHaveLength(14);
    });

    it('should be immutable (frozen-like behavior check)', () => {
      // Check that exported array has expected values
      expect(SIZE_ORDER[0]).toBe('XXS');
      expect(SIZE_ORDER[SIZE_ORDER.length - 1]).toBe('52');
    });
  });

  // ========================================
  // sortSizes function
  // ========================================
  describe('sortSizes', () => {
    // ========================================
    // EXAMPLE-BASED: Happy path, typical inputs
    // ========================================
    describe('happy path', () => {
      it('should sort letter sizes correctly', () => {
        expect(sortSizes(['L', 'S', 'M', 'XL', 'XS']))
          .toEqual(['XS', 'S', 'M', 'L', 'XL']);
      });

      it('should sort number sizes correctly', () => {
        expect(sortSizes(['48', '42', '50', '44', '46']))
          .toEqual(['42', '44', '46', '48', '50']);
      });

      it('should sort mixed letter and number sizes', () => {
        expect(sortSizes(['44', 'M', '42', 'S', 'L', '46']))
          .toEqual(['S', 'M', 'L', '42', '44', '46']);
      });

      it('should maintain order for already sorted array', () => {
        const sorted = ['XS', 'S', 'M', 'L', 'XL'];
        expect(sortSizes(sorted)).toEqual(sorted);
      });

      it('should handle reverse order input', () => {
        expect(sortSizes(['XXL', 'XL', 'L', 'M', 'S', 'XS', 'XXS']))
          .toEqual(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']);
      });

      it('should sort all standard sizes correctly', () => {
        const shuffled = ['M', '48', 'XXL', '40', 'S', '52', 'XS', '46', 'L', '42', 'XXS', '50', 'XL', '44'];
        expect(sortSizes(shuffled))
          .toEqual(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '40', '42', '44', '46', '48', '50', '52']);
      });
    });

    // ========================================
    // BOUNDARY: Empty, null, undefined, edge cases
    // ========================================
    describe('boundary cases', () => {
      it('should return empty array for empty input', () => {
        expect(sortSizes([])).toEqual([]);
      });

      it('should handle single element array', () => {
        expect(sortSizes(['M'])).toEqual(['M']);
      });

      it('should handle single unknown size', () => {
        expect(sortSizes(['XXXL'])).toEqual(['XXXL']);
      });

      it('should handle two elements', () => {
        expect(sortSizes(['L', 'S'])).toEqual(['S', 'L']);
      });

      it('should not mutate original array', () => {
        const original = ['L', 'S', 'M'];
        const originalCopy = [...original];
        sortSizes(original);
        expect(original).toEqual(originalCopy);
      });

      it('should handle duplicate sizes', () => {
        expect(sortSizes(['M', 'S', 'M', 'L', 'S']))
          .toEqual(['S', 'S', 'M', 'M', 'L']);
      });
    });

    // ========================================
    // UNKNOWN SIZES: Placed at the end
    // ========================================
    describe('unknown sizes handling', () => {
      it('should place unknown size at the end', () => {
        expect(sortSizes(['M', 'UNKNOWN', 'S']))
          .toEqual(['S', 'M', 'UNKNOWN']);
      });

      it('should place multiple unknown sizes at the end', () => {
        expect(sortSizes(['M', 'CUSTOM', 'S', 'SPECIAL']))
          .toEqual(['S', 'M', 'CUSTOM', 'SPECIAL']);
      });

      it('should preserve relative order of unknown sizes', () => {
        // Both ALPHA and BETA are unknown, should maintain relative order (stable sort behavior)
        const result = sortSizes(['ALPHA', 'M', 'BETA', 'S']);
        expect(result[0]).toBe('S');
        expect(result[1]).toBe('M');
        // Unknown sizes at the end
        expect(result.slice(2).sort()).toEqual(['ALPHA', 'BETA'].sort());
      });

      it('should handle all unknown sizes', () => {
        const result = sortSizes(['CUSTOM1', 'CUSTOM2', 'CUSTOM3']);
        // All unknown, relative order should be preserved
        expect(result.length).toBe(3);
        expect(result).toContain('CUSTOM1');
        expect(result).toContain('CUSTOM2');
        expect(result).toContain('CUSTOM3');
      });

      it('should handle lowercase sizes as unknown', () => {
        // lowercase 'm' is not the same as 'M'
        expect(sortSizes(['m', 'M', 's', 'S']))
          .toEqual(['S', 'M', 'm', 's']);
      });

      it('should handle numeric sizes not in standard list', () => {
        expect(sortSizes(['42', '38', '44', '56']))
          .toEqual(['42', '44', '38', '56']);
      });

      it('should handle XXXL as unknown (not in standard list)', () => {
        expect(sortSizes(['XXL', 'XXXL', 'XL']))
          .toEqual(['XL', 'XXL', 'XXXL']);
      });
    });

    // ========================================
    // ERROR / EDGE CASES
    // ========================================
    describe('edge cases', () => {
      it('should handle size with whitespace as unknown', () => {
        expect(sortSizes([' M', 'M', 'S']))
          .toEqual(['S', 'M', ' M']);
      });

      it('should handle sizes with different casing as different sizes', () => {
        expect(sortSizes(['m', 'M'])).toEqual(['M', 'm']);
      });

      it('should handle numeric string variations', () => {
        // '042' is different from '42'
        expect(sortSizes(['042', '42', '44']))
          .toEqual(['42', '44', '042']);
      });

      it('should handle very long arrays', () => {
        const longArray = Array(100).fill(null).map((_, i) =>
          SIZE_ORDER[i % SIZE_ORDER.length]
        );
        const result = sortSizes(longArray);
        expect(result).toHaveLength(100);
        // First element should be XXS
        expect(result[0]).toBe('XXS');
      });
    });

    // ========================================
    // REAL-WORLD SCENARIOS
    // ========================================
    describe('real-world scenarios', () => {
      it('should sort typical clothing sizes for display', () => {
        // Typical e-commerce size selector
        expect(sortSizes(['M', 'S', 'XL', 'L', 'XS']))
          .toEqual(['XS', 'S', 'M', 'L', 'XL']);
      });

      it('should sort shoe sizes correctly', () => {
        expect(sortSizes(['44', '40', '42', '46']))
          .toEqual(['40', '42', '44', '46']);
      });

      it('should handle product with both letter and number variants', () => {
        // Some products come in both European numeric and letter sizes
        expect(sortSizes(['S', '42', 'M', '44', 'L', '46']))
          .toEqual(['S', 'M', 'L', '42', '44', '46']);
      });

      it('should sort typical size run for a product', () => {
        expect(sortSizes(['XL', 'S', 'XXL', 'M', 'L']))
          .toEqual(['S', 'M', 'L', 'XL', 'XXL']);
      });

      it('should handle size with ONE-SIZE variant', () => {
        expect(sortSizes(['ONE-SIZE', 'M', 'S']))
          .toEqual(['S', 'M', 'ONE-SIZE']);
      });
    });
  });
});
