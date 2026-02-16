import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a test query client with disabled retries and caching
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Wrapper component for renderHook
export const createWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    );
  };
};

// Mock for queryClient.invalidateQueries
export const mockInvalidateQueries = vi.fn();

// Create a mock query client with spies
export const createMockQueryClient = () => {
  const client = createTestQueryClient();
  vi.spyOn(client, 'invalidateQueries').mockImplementation(mockInvalidateQueries);
  return client;
};
