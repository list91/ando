import { create } from 'zustand';

interface PriceFilterState {
  min: string;
  max: string;
  setMin: (value: string) => void;
  setMax: (value: string) => void;
  reset: () => void;
}

export const usePriceFilterStore = create<PriceFilterState>((set) => ({
  min: '',
  max: '',
  setMin: (value) => set({ min: value }),
  setMax: (value) => set({ max: value }),
  reset: () => set({ min: '', max: '' }),
}));

// Селекторы для подписки на конкретные значения
export const selectPriceMin = (state: PriceFilterState) => state.min;
export const selectPriceMax = (state: PriceFilterState) => state.max;
export const selectPriceReset = (state: PriceFilterState) => state.reset;
