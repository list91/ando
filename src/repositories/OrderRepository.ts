import { BaseRepository, QueryOptions, RepositoryResult } from './BaseRepository';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

/**
 * Order with items
 */
export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

/**
 * Order status values
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Filter options for order queries
 */
export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
  customerEmail?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Repository for Order entity operations
 */
export class OrderRepository extends BaseRepository<'orders'> {
  constructor() {
    super('orders');
  }

  /**
   * Find all orders with items
   */
  async findAllWithItems(
    options?: QueryOptions<Order>
  ): Promise<RepositoryResult<OrderWithItems[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          size,
          color
        )
      `)
      .order('created_at', { ascending: false });

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

    return { data: data as OrderWithItems[], error: null };
  }

  /**
   * Find order by ID with items
   */
  async findByIdWithItems(id: string): Promise<RepositoryResult<OrderWithItems | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          size,
          color
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as OrderWithItems | null, error: null };
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<RepositoryResult<OrderWithItems | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          size,
          color
        )
      `)
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as OrderWithItems | null, error: null };
  }

  /**
   * Find orders by user ID
   */
  async findByUserId(
    userId: string,
    options?: QueryOptions<Order>
  ): Promise<RepositoryResult<OrderWithItems[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          size,
          color
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as OrderWithItems[], error: null };
  }

  /**
   * Find orders by status
   */
  async findByStatus(
    status: OrderStatus,
    options?: QueryOptions<Order>
  ): Promise<RepositoryResult<OrderWithItems[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          size,
          color
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as OrderWithItems[], error: null };
  }

  /**
   * Find orders matching filters
   */
  async findByFilters(filters: OrderFilters): Promise<RepositoryResult<OrderWithItems[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          size,
          color
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.customerEmail) {
      query = query.ilike('customer_email', `%${filters.customerEmail}%`);
    }

    if (filters.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte('created_at', filters.toDate);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as OrderWithItems[], error: null };
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: OrderStatus): Promise<RepositoryResult<Order>> {
    return this.update(id, { status, updated_at: new Date().toISOString() });
  }

  /**
   * Create order with items (transaction-like)
   */
  async createWithItems(
    order: OrderInsert,
    items: Omit<OrderItemInsert, 'order_id'>[]
  ): Promise<RepositoryResult<OrderWithItems>> {
    // Create order first
    const { data: orderData, error: orderError } = await this.supabase
      .from(this.tableName)
      .insert(order)
      .select()
      .single();

    if (orderError) {
      return { data: null, error: this.handleError(orderError) };
    }

    // Create order items
    const orderItems = items.map((item) => ({
      ...item,
      order_id: orderData.id
    }));

    const { data: itemsData, error: itemsError } = await this.supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      // Rollback: delete the order if items creation fails
      await this.delete(orderData.id);
      return { data: null, error: this.handleError(itemsError) };
    }

    return {
      data: {
        ...orderData,
        order_items: itemsData
      } as OrderWithItems,
      error: null
    };
  }

  /**
   * Get order statistics
   */
  async getStatistics(): Promise<
    RepositoryResult<{
      totalOrders: number;
      pendingOrders: number;
      totalRevenue: number;
    }>
  > {
    // Total orders
    const { count: totalOrders, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return { data: null, error: this.handleError(countError) };
    }

    // Pending orders
    const { count: pendingOrders, error: pendingError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) {
      return { data: null, error: this.handleError(pendingError) };
    }

    // Total revenue (from delivered orders)
    const { data: revenueData, error: revenueError } = await this.supabase
      .from(this.tableName)
      .select('total_amount')
      .eq('status', 'delivered');

    if (revenueError) {
      return { data: null, error: this.handleError(revenueError) };
    }

    const totalRevenue = (revenueData || []).reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );

    return {
      data: {
        totalOrders: totalOrders ?? 0,
        pendingOrders: pendingOrders ?? 0,
        totalRevenue
      },
      error: null
    };
  }
}

// Singleton instance for convenience
export const orderRepository = new OrderRepository();
