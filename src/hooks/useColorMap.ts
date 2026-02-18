import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ColorMapping {
  [key: string]: string;
}

// Default color mappings for common color names (Russian)
const DEFAULT_COLORS: ColorMapping = {
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

export const useColorMap = () => {
  const [colorMap, setColorMap] = useState<ColorMapping>(DEFAULT_COLORS);

  useEffect(() => {
    const fetchColors = async () => {
      const { data } = await supabase
        .from('color_mappings')
        .select('color_name, hex_value');

      if (data && data.length > 0) {
        const dbColors: ColorMapping = {};
        data.forEach((item: { color_name: string; hex_value: string }) => {
          dbColors[item.color_name.toLowerCase()] = item.hex_value;
        });
        setColorMap({ ...DEFAULT_COLORS, ...dbColors });
      }
    };

    fetchColors();
  }, []);

  const getColorHex = useCallback((colorName: string): string => {
    const normalizedName = colorName.toLowerCase().trim();
    return colorMap[normalizedName] || '#CCCCCC';
  }, [colorMap]);

  return { getColorHex, colorMap };
};
