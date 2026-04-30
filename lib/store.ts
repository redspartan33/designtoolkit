'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  visualStyle: 'nature' | 'earth';
  setVisualStyle: (style: 'nature' | 'earth') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      visualStyle: 'nature',
      setVisualStyle: (style) => set({ visualStyle: style }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
