/**
 * Size ordering utilities for ANDO
 *
 * Standard size order:
 * - Letter sizes: XXS, XS, S, M, L, XL, XXL
 * - Number sizes: 40, 42, 44, 46, 48, 50, 52
 */

export const SIZE_ORDER = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '40', '42', '44', '46', '48', '50', '52'
];

/**
 * Sort sizes array according to standard order
 * Unknown sizes are placed at the end in original order
 */
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a);
    const indexB = SIZE_ORDER.indexOf(b);

    // Both known - sort by order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // Unknown sizes go to the end
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    return -1;
  });
}
