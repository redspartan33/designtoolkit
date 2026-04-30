'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VisualStyle = 'nature' | 'earth' | 'aurora' | 'cyber' | 'ocean';

interface UIState {
  visualStyle: VisualStyle;
  commandPaletteOpen: boolean;
  toolUsageCounts: Record<string, number>;
  setVisualStyle: (style: VisualStyle) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  incrementToolUsage: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      visualStyle: 'nature',
      commandPaletteOpen: false,
      toolUsageCounts: {},
      setVisualStyle: (style) => set({ visualStyle: style }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      incrementToolUsage: (id) =>
        set((state) => ({
          toolUsageCounts: {
            ...state.toolUsageCounts,
            [id]: (state.toolUsageCounts[id] || 0) + 1,
          },
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        visualStyle: state.visualStyle,
        toolUsageCounts: state.toolUsageCounts,
      }),
    }
  )
);
