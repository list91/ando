/**
 * Оптимизация изображений через Supabase Image Transformation
 *
 * Только сжатие качества БЕЗ изменения размера (без зума)
 * - thumb:  quality 50 (~150KB) - для каталога/превью
 * - medium: quality 65 (~250KB) - для страницы товара
 * - large:  quality 80 (~400KB) - для зума
 */

type ImageSize = 'thumb' | 'medium' | 'large';

const QUALITY_PARAMS: Record<ImageSize, number> = {
  thumb:  50,  // Каталог - максимальное сжатие
  medium: 65,  // Страница товара
  large:  80,  // Зум - высокое качество
};

/**
 * Преобразует URL изображения из Supabase Storage в оптимизированный URL
 * с пониженным качеством (без изменения размера).
 *
 * @param url - оригинальный URL изображения
 * @param size - качество: 'thumb' | 'medium' | 'large'
 * @returns оптимизированный URL или оригинальный, если не Supabase
 */
export function getOptimizedImageUrl(url: string, size: ImageSize = 'medium'): string {
  // Пропускаем пустые URL
  if (!url) return url;

  // Только для Supabase Storage URL
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  const quality = QUALITY_PARAMS[size];

  // Заменяем /object/public/ на /render/image/public/ для трансформации
  const transformedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  // Добавляем только параметр качества (без width - сохраняем оригинальный размер)
  const separator = transformedUrl.includes('?') ? '&' : '?';
  return `${transformedUrl}${separator}quality=${quality}`;
}

/**
 * Получить URL для превью (каталог, карточки товаров)
 */
export function getThumbUrl(url: string): string {
  return getOptimizedImageUrl(url, 'thumb');
}

/**
 * Получить URL для страницы товара
 */
export function getMediumUrl(url: string): string {
  return getOptimizedImageUrl(url, 'medium');
}

/**
 * Получить URL для зума/полноразмерного просмотра
 */
export function getLargeUrl(url: string): string {
  return getOptimizedImageUrl(url, 'large');
}
