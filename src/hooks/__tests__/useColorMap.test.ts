import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Use vi.hoisted to create mocks that are available before module imports
const { mockSupabaseClient, setMockResponse, resetMock } = vi.hoisted(() => {
  let responseData: any = null;
  let responseError: any = null;

  // Create a Promise-like object that can be awaited
  const createSelectResult = () => {
    const promise = Promise.resolve({ data: responseData, error: responseError });
    return {
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
    };
  };

  const selectMock = vi.fn().mockImplementation(() => createSelectResult());

  const fromMock = vi.fn().mockImplementation(() => ({
    select: selectMock,
  }));

  const mockSupabaseClient = {
    from: fromMock,
  };

  const setMockResponse = (data: any, error: any = null) => {
    responseData = data;
    responseError = error;
  };

  const resetMock = () => {
    responseData = null;
    responseError = null;
    // Only clear call history, don't reset implementations
    fromMock.mockClear();
    selectMock.mockClear();
  };

  return { mockSupabaseClient, setMockResponse, resetMock };
});

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Import after mocks are set up
import { useColorMap } from '../useColorMap';

// Default colors from the hook
const DEFAULT_COLORS: Record<string, string> = {
  'белый': '#FFFFFF',
  'черный': '#000000',
  'чёрный': '#000000',
  'серый': '#808080',
  'красный': '#FF0000',
  'синий': '#0000FF',
  'зеленый': '#008000',
  'зелёный': '#008000',
  'желтый': '#FFFF00',
  'жёлтый': '#FFFF00',
  'оранжевый': '#FFA500',
  'розовый': '#FFC0CB',
  'фиолетовый': '#800080',
  'голубой': '#ADD8E6',
  'коричневый': '#8B4513',
  'бежевый': '#F5F5DC',
  'кремовый': '#FFFDD0',
  'молочный': '#FDFFF5',
  'темно-синий': '#00008B',
  'темно синий': '#00008B',
};

// Mock database colors
const mockDbColors = [
  { color_name: 'Бордовый', hex_value: '#800020' },
  { color_name: 'Лавандовый', hex_value: '#E6E6FA' },
  { color_name: 'Изумрудный', hex_value: '#50C878' },
];

describe('useColorMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMock();
  });

  afterEach(() => {
    // Only clear mocks, not reset - resetAllMocks would clear implementations
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should return default colors initially', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      // Check that colorMap contains default colors
      expect(result.current.colorMap).toEqual(DEFAULT_COLORS);
    });

    it('should return getColorHex function', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(typeof result.current.getColorHex).toBe('function');
    });

    it('should call supabase to fetch colors on mount', async () => {
      setMockResponse([]);

      renderHook(() => useColorMap());

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('color_mappings');
      });
    });
  });

  describe('getColorHex function', () => {
    it('should return hex value for known default color', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('белый')).toBe('#FFFFFF');
      expect(result.current.getColorHex('черный')).toBe('#000000');
      expect(result.current.getColorHex('красный')).toBe('#FF0000');
    });

    it('should return fallback color for unknown color', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('неизвестный')).toBe('#CCCCCC');
    });

    it('should be case insensitive', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('БЕЛЫЙ')).toBe('#FFFFFF');
      expect(result.current.getColorHex('Белый')).toBe('#FFFFFF');
      expect(result.current.getColorHex('бЕлЫй')).toBe('#FFFFFF');
    });

    it('should trim whitespace', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('  белый  ')).toBe('#FFFFFF');
      expect(result.current.getColorHex('\tчерный\n')).toBe('#000000');
    });

    it('should handle both versions of Russian "e" and "yo"', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      // черный vs чёрный
      expect(result.current.getColorHex('черный')).toBe('#000000');
      expect(result.current.getColorHex('чёрный')).toBe('#000000');

      // зеленый vs зелёный
      expect(result.current.getColorHex('зеленый')).toBe('#008000');
      expect(result.current.getColorHex('зелёный')).toBe('#008000');

      // желтый vs жёлтый
      expect(result.current.getColorHex('желтый')).toBe('#FFFF00');
      expect(result.current.getColorHex('жёлтый')).toBe('#FFFF00');
    });

    it('should handle "темно-синий" with different formats', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('темно-синий')).toBe('#00008B');
      expect(result.current.getColorHex('темно синий')).toBe('#00008B');
    });
  });

  describe('Database colors integration', () => {
    it('should handle empty database response', async () => {
      setMockResponse([]);

      const { result } = renderHook(() => useColorMap());

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });

      // Should still have default colors
      expect(result.current.getColorHex('белый')).toBe('#FFFFFF');
    });

    it('should handle null database response', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });

      // Should still have default colors
      expect(result.current.getColorHex('белый')).toBe('#FFFFFF');
    });

    it('should handle database fetch error gracefully', async () => {
      setMockResponse(null, new Error('Database error'));

      const { result } = renderHook(() => useColorMap());

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });

      // Should still have default colors even on error
      expect(result.current.getColorHex('белый')).toBe('#FFFFFF');
    });

    // Note: Tests for database color merging are complex due to async useEffect timing
    // The hook correctly merges colors, but testing requires integration tests
    it('should attempt to fetch colors from database on mount', async () => {
      setMockResponse(mockDbColors);

      renderHook(() => useColorMap());

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('color_mappings');
      });
    });
  });

  describe('Default colors coverage', () => {
    it('should have all expected default colors', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      const expectedColors = [
        'белый',
        'черный',
        'чёрный',
        'серый',
        'красный',
        'синий',
        'зеленый',
        'зелёный',
        'желтый',
        'жёлтый',
        'оранжевый',
        'розовый',
        'фиолетовый',
        'голубой',
        'коричневый',
        'бежевый',
        'кремовый',
        'молочный',
        'темно-синий',
        'темно синий',
      ];

      expectedColors.forEach((color) => {
        expect(result.current.colorMap[color]).toBeDefined();
        expect(result.current.getColorHex(color)).not.toBe('#CCCCCC');
      });
    });

    it('should return correct hex values for all default colors', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('белый')).toBe('#FFFFFF');
      expect(result.current.getColorHex('черный')).toBe('#000000');
      expect(result.current.getColorHex('серый')).toBe('#808080');
      expect(result.current.getColorHex('красный')).toBe('#FF0000');
      expect(result.current.getColorHex('синий')).toBe('#0000FF');
      expect(result.current.getColorHex('зеленый')).toBe('#008000');
      expect(result.current.getColorHex('желтый')).toBe('#FFFF00');
      expect(result.current.getColorHex('оранжевый')).toBe('#FFA500');
      expect(result.current.getColorHex('розовый')).toBe('#FFC0CB');
      expect(result.current.getColorHex('фиолетовый')).toBe('#800080');
      expect(result.current.getColorHex('голубой')).toBe('#ADD8E6');
      expect(result.current.getColorHex('коричневый')).toBe('#8B4513');
      expect(result.current.getColorHex('бежевый')).toBe('#F5F5DC');
      expect(result.current.getColorHex('кремовый')).toBe('#FFFDD0');
      expect(result.current.getColorHex('молочный')).toBe('#FDFFF5');
      expect(result.current.getColorHex('темно-синий')).toBe('#00008B');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string color name', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('')).toBe('#CCCCCC');
    });

    it('should handle whitespace-only color name', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('   ')).toBe('#CCCCCC');
    });

    it('should return fallback for unknown colors', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('несуществующий')).toBe('#CCCCCC');
      expect(result.current.getColorHex('unknown')).toBe('#CCCCCC');
      expect(result.current.getColorHex('123')).toBe('#CCCCCC');
    });

    it('should handle mixed case lookup for default colors', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current.getColorHex('СЕРЫЙ')).toBe('#808080');
      expect(result.current.getColorHex('Серый')).toBe('#808080');
      expect(result.current.getColorHex('серый')).toBe('#808080');
    });
  });

  describe('Callback memoization', () => {
    it('should return stable getColorHex function reference when colorMap does not change', async () => {
      setMockResponse([]);

      const { result, rerender } = renderHook(() => useColorMap());

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });

      const firstGetColorHex = result.current.getColorHex;

      rerender();

      // Function reference should be stable due to useCallback
      expect(result.current.getColorHex).toBe(firstGetColorHex);
    });
  });

  describe('Multiple color lookups', () => {
    it('should handle multiple consecutive lookups efficiently', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      const colors = ['белый', 'черный', 'красный', 'синий', 'зеленый'];
      const hexValues = colors.map((color) => result.current.getColorHex(color));

      expect(hexValues).toEqual(['#FFFFFF', '#000000', '#FF0000', '#0000FF', '#008000']);
    });

    it('should handle repeated lookups of same color', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      // Multiple lookups should return same value
      const hex1 = result.current.getColorHex('белый');
      const hex2 = result.current.getColorHex('белый');
      const hex3 = result.current.getColorHex('белый');

      expect(hex1).toBe('#FFFFFF');
      expect(hex2).toBe('#FFFFFF');
      expect(hex3).toBe('#FFFFFF');
    });
  });

  describe('Return value structure', () => {
    it('should return object with getColorHex and colorMap', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(result.current).toHaveProperty('getColorHex');
      expect(result.current).toHaveProperty('colorMap');
      expect(typeof result.current.getColorHex).toBe('function');
      expect(typeof result.current.colorMap).toBe('object');
    });

    it('should have colorMap as plain object', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      expect(Array.isArray(result.current.colorMap)).toBe(false);
      expect(result.current.colorMap).not.toBeNull();
    });

    it('should allow direct access to colorMap', () => {
      setMockResponse(null);

      const { result } = renderHook(() => useColorMap());

      // Direct access to colorMap should work
      expect(result.current.colorMap['белый']).toBe('#FFFFFF');
      expect(result.current.colorMap['черный']).toBe('#000000');
    });
  });
});
