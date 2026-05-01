"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LOCALE } from "./i18n/messages";
import type { Locale } from "./i18n/types";

interface UIState {
  locale: Locale;
  commandPaletteOpen: boolean;
  toolUsageCounts: Record<string, number>;
  setLocale: (locale: Locale) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  incrementToolUsage: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      commandPaletteOpen: false,
      toolUsageCounts: {},
      setLocale: (locale) => set({ locale }),
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
        locale: state.locale,
        toolUsageCounts: state.toolUsageCounts,
      }),
    },
  ),
);
