import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { UserDiscount, CreateDiscountDTO, UpdateDiscountDTO } from '@/types/discount';

// Hoisted mocks
const mockToast = vi.hoisted(() => Object.assign(vi.fn(), {
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import {
  useUserDiscounts,
  useAdminDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
  useValidatePromoCode,
} from '../useUserDiscounts';

// Mock data factory
const createMockDiscount = (overrides: Partial<UserDiscount> = {}): UserDiscount => ({
  id: 'discount-1',
  user_id: 'user-1',
  discount_type: 'personal',
  discount_amount: 10,
  description: 'Test discount',
  assigned_by_admin: 'admin-1',
  is_active: true,
  valid_from: new Date().toISOString(),
  valid_until: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Test wrapper factory
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
};

// Supabase mock builder
type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

const createMockQueryBuilder = (result: { data?: unknown; error?: Error | null }): MockQueryBuilder => {
  const builder: MockQueryBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.order.mockReturnValue(Promise.resolve(result));
  builder.eq.mockReturnValue(builder);
  builder.single.mockReturnValue(Promise.resolve(result));

  return builder;
};

describe('useUserDiscounts', () => {
  const mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;
  const mockGetUser = supabase.auth.getUser as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user discounts successfully', async () => {
    const mockDiscounts: UserDiscount[] = [
      createMockDiscount({ id: '1', discount_amount: 10 }),
      createMockDiscount({ id: '2', discount_amount: 15 }),
    ];

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockBuilder = createMockQueryBuilder({ data: mockDiscounts, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserDiscounts(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].discount_amount).toBe(10);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('user_discounts');
  });

  it('should handle unauthorized user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserDiscounts(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('не авторизован');
  });

  it('should handle database error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockBuilder = createMockQueryBuilder({
      data: null,
      error: new Error('Database error'),
    });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserDiscounts(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Database error');
  });

  it('should filter only active discounts', async () => {
    const mockDiscounts: UserDiscount[] = [
      createMockDiscount({ id: '1', is_active: true }),
      createMockDiscount({ id: '2', is_active: true }),
    ];

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockBuilder = createMockQueryBuilder({ data: mockDiscounts, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserDiscounts(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify .eq('is_active', true) was called
    expect(mockBuilder.eq).toHaveBeenCalledWith('is_active', true);
  });
});

describe('useAdminDiscounts', () => {
  const mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all discounts for admin', async () => {
    const mockDiscounts: UserDiscount[] = [
      createMockDiscount({ id: '1' }),
      createMockDiscount({ id: '2' }),
      createMockDiscount({ id: '3' }),
    ];

    const mockBuilder = createMockQueryBuilder({ data: mockDiscounts, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAdminDiscounts(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});

describe('useCreateDiscount', () => {
  const mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;
  const mockGetUser = supabase.auth.getUser as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create discount successfully', async () => {
    const newDiscount: CreateDiscountDTO = {
      user_id: 'user-2',
      discount_type: 'personal',
      discount_amount: 20,
      description: 'New discount',
    };

    const createdDiscount = createMockDiscount({
      ...newDiscount,
      id: 'new-discount-1',
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    const mockBuilder = createMockQueryBuilder({ data: createdDiscount, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useCreateDiscount(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(newDiscount);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.discount_amount).toBe(20);
    expect(mockToast.success).toHaveBeenCalledWith('Скидка создана');
    expect(mockBuilder.insert).toHaveBeenCalled();
  });

  it('should handle creation error', async () => {
    const newDiscount: CreateDiscountDTO = {
      user_id: 'user-2',
      discount_type: 'personal',
      discount_amount: 20,
    };

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-1' } },
      error: null,
    });

    const mockBuilder = createMockQueryBuilder({
      data: null,
      error: new Error('Creation failed'),
    });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateDiscount(), { wrapper: Wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync(newDiscount);
      } catch (error) {
        // Expected error
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToast.error).toHaveBeenCalled();
  });
});

describe('useUpdateDiscount', () => {
  const mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update discount successfully', async () => {
    const updateData: UpdateDiscountDTO & { id: string } = {
      id: 'discount-1',
      discount_amount: 25,
      description: 'Updated discount',
    };

    const updatedDiscount = createMockDiscount({
      id: 'discount-1',
      discount_amount: 25,
      description: 'Updated discount',
    });

    const mockBuilder = createMockQueryBuilder({ data: updatedDiscount, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateDiscount(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(updateData);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.discount_amount).toBe(25);
    expect(mockToast.success).toHaveBeenCalledWith('Скидка обновлена');
  });

  it('should handle update error', async () => {
    const updateData: UpdateDiscountDTO & { id: string } = {
      id: 'discount-1',
      discount_amount: 25,
    };

    const mockBuilder = createMockQueryBuilder({
      data: null,
      error: new Error('Update failed'),
    });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateDiscount(), { wrapper: Wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync(updateData);
      } catch (error) {
        // Expected error
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToast.error).toHaveBeenCalled();
  });
});

describe('useDeleteDiscount', () => {
  const mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete discount successfully', async () => {
    const mockBuilder = createMockQueryBuilder({ data: null, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteDiscount(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync('discount-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.success).toHaveBeenCalledWith('Скидка удалена');
    expect(mockBuilder.delete).toHaveBeenCalled();
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'discount-1');
  });

  it('should handle deletion error', async () => {
    const mockBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Deletion failed') }),
    };
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteDiscount(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate('discount-1');
    });

    await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
  });
});

describe('useValidatePromoCode', () => {
  const mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate promo code successfully', async () => {
    const validPromoCode = {
      id: 'promo-1',
      code: 'SUMMER20',
      discount_amount: 20,
      is_active: true,
      max_uses: 100,
      used_count: 50,
      valid_from: new Date(Date.now() - 86400000).toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };

    const mockBuilder = createMockQueryBuilder({ data: validPromoCode, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useValidatePromoCode(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync('SUMMER20');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.code).toBe('SUMMER20');
    expect(mockToast.success).toHaveBeenCalledWith('Промокод применен: 20% скидка');
  });

  it('should reject inactive promo code', async () => {
    const mockBuilder = createMockQueryBuilder({
      data: null,
      error: new Error('Not found'),
    });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useValidatePromoCode(), { wrapper: Wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync('INVALID');
      } catch (error) {
        // Expected error
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockToast.error).toHaveBeenCalled();
  });

  it('should reject expired promo code', async () => {
    const expiredPromoCode = {
      id: 'promo-2',
      code: 'EXPIRED',
      discount_amount: 15,
      is_active: true,
      max_uses: null,
      used_count: 0,
      valid_from: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      valid_until: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      created_at: new Date().toISOString(),
    };

    const mockBuilder = createMockQueryBuilder({ data: expiredPromoCode, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useValidatePromoCode(), { wrapper: Wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync('EXPIRED');
      } catch (error) {
        // Expected error
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Срок действия промокода истек');
  });

  it('should reject promo code with exhausted uses', async () => {
    const exhaustedPromoCode = {
      id: 'promo-3',
      code: 'FULL',
      discount_amount: 10,
      is_active: true,
      max_uses: 100,
      used_count: 100,
      valid_from: new Date(Date.now() - 86400000).toISOString(),
      valid_until: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };

    const mockBuilder = createMockQueryBuilder({ data: exhaustedPromoCode, error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useValidatePromoCode(), { wrapper: Wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync('FULL');
      } catch (error) {
        // Expected error
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Промокод исчерпан');
  });
});
