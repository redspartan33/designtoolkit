'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VisualStyle = 'nature' | 'earth' | 'aurora' | 'cyber' | 'ocean';

interface UIState {
  visualStyle: VisualStyle;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  recentToolIds: string[];
  setVisualStyle: (style: VisualStyle) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  addRecentTool: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      visualStyle: 'nature',
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      recentToolIds: [],
      setVisualStyle: (style) => set({ visualStyle: style }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      addRecentTool: (id) =>
        set((state) => ({
          recentToolIds: [id, ...state.recentToolIds.filter((i) => i !== id)].slice(0, 6),
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        visualStyle: state.visualStyle,
        sidebarCollapsed: state.sidebarCollapsed,
        recentToolIds: state.recentToolIds,
      }),
    }
  )
);
