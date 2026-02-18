import { vi } from 'vitest';

// Mock for use-toast hook
export const mockToast = vi.fn();
export const mockUseToast = () => ({ toast: mockToast });

// Mock for sonner toast
export const mockSonnerToast = Object.assign(vi.fn(), {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
});

// Mock the actual imports
vi.mock('@/hooks/use-toast', () => ({
  useToast: mockUseToast,
  toast: mockToast,
}));

vi.mock('sonner', () => ({
  toast: mockSonnerToast,
}));

// Reset all toast mocks
export const resetToastMocks = () => {
  mockToast.mockReset();
  mockSonnerToast.mockReset();
  mockSonnerToast.success.mockReset();
  mockSonnerToast.error.mockReset();
  mockSonnerToast.info.mockReset();
  mockSonnerToast.warning.mockReset();
  mockSonnerToast.loading.mockReset();
  mockSonnerToast.dismiss.mockReset();
};
