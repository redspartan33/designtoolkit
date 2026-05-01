"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  commandPaletteOpen: boolean;
  toolUsageCounts: Record<string, number>;
  setCommandPaletteOpen: (open: boolean) => void;
  incrementToolUsage: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      commandPaletteOpen: false,
      toolUsageCounts: {},
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
      name: "ui-storage",
      partialize: (state) => ({
        toolUsageCounts: state.toolUsageCounts,
      }),
    },
  ),
);
