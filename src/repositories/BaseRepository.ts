import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Repository error with structured information
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: string,
    public readonly hint?: string
  ) {
    super(message);
    this.name = 'RepositoryError';
  }

  static fromPostgrestError(error: PostgrestError): RepositoryError {
    return new RepositoryError(
      error.message,
      error.code,
      error.details,
      error.hint
    );
  }
}

/**
 * Query options for list operations
 */
export interface QueryOptions<T> {
  orderBy?: {
    column: keyof T & string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

/**
 * Result wrapper for repository operations
 */
export type RepositoryResult<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: RepositoryError;
};

/**
 * Table names from Database schema
 */
export type TableName = keyof Database['public']['Tables'];

/**
 * Row type for a given table
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

/**
 * Insert type for a given table
 */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

/**
 * Update type for a given table
 */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

/**
 * Abstract base repository providing common CRUD operations
 *
 * @example
 * ```ts
 * class ProductRepository extends BaseRepository<'products'> {
 *   constructor() {
 *     super('products');
 *   }
 *
 *   async findByCategory(categoryId: string) {
 *     return this.findAllWhere({ category_id: categoryId });
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<T extends TableName> {
  protected supabase: SupabaseClient<Database>;
  protected tableName: T;

  constructor(tableName: T) {
    this.tableName = tableName;
    this.supabase = supabase;
  }

  /**
   * Handle Supabase errors uniformly
   */
  protected handleError(error: PostgrestError): RepositoryError {
    return RepositoryError.fromPostgrestError(error);
  }

  /**
   * Fetch all records from the table
   */
  async findAll(options?: QueryOptions<TableRow<T>>): Promise<RepositoryResult<TableRow<T>[]>> {
    let query = this.supabase.from(this.tableName).select('*');

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as TableRow<T>[], error: null };
  }

  /**
   * Fetch records matching conditions
   */
  async findAllWhere(
    conditions: Partial<TableRow<T>>,
    options?: QueryOptions<TableRow<T>>
  ): Promise<RepositoryResult<TableRow<T>[]>> {
    let query = this.supabase.from(this.tableName).select('*');

    // Apply conditions
    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as TableRow<T>[], error: null };
  }

  /**
   * Fetch a single record by ID
   */
  async findById(id: string): Promise<RepositoryResult<TableRow<T> | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as TableRow<T> | null, error: null };
  }

  /**
   * Create a new record
   */
  async create(item: TableInsert<T>): Promise<RepositoryResult<TableRow<T>>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(item as Record<string, unknown>)
      .select()
      .single();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as TableRow<T>, error: null };
  }

  /**
   * Create multiple records
   */
  async createMany(items: TableInsert<T>[]): Promise<RepositoryResult<TableRow<T>[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(items as Record<string, unknown>[])
      .select();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as TableRow<T>[], error: null };
  }

  /**
   * Update a record by ID
   */
  async update(id: string, updates: TableUpdate<T>): Promise<RepositoryResult<TableRow<T>>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as TableRow<T>, error: null };
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<RepositoryResult<void>> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: undefined, error: null };
  }

  /**
   * Delete multiple records by IDs
   */
  async deleteMany(ids: string[]): Promise<RepositoryResult<void>> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .in('id', ids);

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: undefined, error: null };
  }

  /**
   * Count records matching conditions
   */
  async count(conditions?: Partial<TableRow<T>>): Promise<RepositoryResult<number>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (conditions) {
      for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      }
    }

    const { count, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: count ?? 0, error: null };
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data !== null, error: null };
  }
}
