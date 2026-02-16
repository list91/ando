/**
 * Repository Pattern for Supabase
 *
 * This module provides a clean abstraction layer between React hooks and Supabase.
 * Each repository handles database operations for a specific entity type.
 *
 * Benefits:
 * - Centralized error handling
 * - Type-safe database operations
 * - Easy to test (mock repositories instead of Supabase)
 * - Single responsibility principle
 *
 * Usage in hooks:
 * ```ts
 * import { productRepository } from '@/repositories';
 *
 * export const useProducts = () => {
 *   return useQuery({
 *     queryKey: ['products'],
 *     queryFn: async () => {
 *       const { data, error } = await productRepository.findAllWithImages();
 *       if (error) throw error;
 *       return data;
 *     }
 *   });
 * };
 * ```
 */

// Base
export {
  BaseRepository,
  RepositoryError,
  type QueryOptions,
  type RepositoryResult,
  type TableName,
  type TableRow,
  type TableInsert,
  type TableUpdate
} from './BaseRepository';

// Product
export {
  ProductRepository,
  productRepository,
  type ProductWithImages,
  type ProductWithRelations,
  type ProductFilters,
  type ProductFilterValues
} from './ProductRepository';

// Order
export {
  OrderRepository,
  orderRepository,
  type OrderWithItems,
  type OrderStatus,
  type OrderFilters
} from './OrderRepository';

// Category
export {
  CategoryRepository,
  categoryRepository,
  type CategoryWithCount
} from './CategoryRepository';
