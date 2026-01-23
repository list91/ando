import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useColorMap() {
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadColors = async () => {
      const { data } = await supabase.from('colors').select('name, hex_code');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(c => {
          map[c.name.toLowerCase().trim()] = c.hex_code || '#CCCCCC';
        });
        setColorMap(map);
      }
      setIsLoaded(true);
    };
    loadColors();
  }, []);

  const getColorHex = useCallback((colorName: string): string => {
    return colorMap[colorName.toLowerCase().trim()] || '#CCCCCC';
  }, [colorMap]);

  return { colorMap, getColorHex, isLoaded };
}
