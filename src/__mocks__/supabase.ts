import { vi } from 'vitest';

// Chainable mock builder for Supabase queries
const createChainableMock = () => {
  const mock: any = {
    _data: null,
    _error: null,

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
      data: mock._data,
      error: mock._error
    })),
    maybeSingle: vi.fn().mockImplementation(async () => ({
      data: mock._data,
      error: mock._error
    })),
    then: vi.fn().mockImplementation((resolve) =>
      Promise.resolve({ data: mock._data, error: mock._error }).then(resolve)
    ),
  };

  return mock;
};

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const chainable = createChainableMock();

  return {
    from: vi.fn().mockReturnValue(chainable),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } }),
      }),
    },
    // Helper to set mock response
    __setMockResponse: (data: any, error: any = null) => {
      chainable._data = data;
      chainable._error = error;
    },
    __getChainable: () => chainable,
  };
};

// Default mock instance
export const mockSupabase = createMockSupabaseClient();

// Mock the actual import
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));
