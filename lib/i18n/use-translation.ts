"use client";

import { useUIStore } from "@/lib/store";
import { DEFAULT_LOCALE, LOCALES } from "./messages";

/**
 * useTranslation — read the active locale from the store and return a `t(key)`
 * lookup with optional fallback. If a key is missing in the active locale,
 * `t` falls back to the explicit fallback, then to the default locale, then
 * returns the key itself (visible bug surface).
 *
 * Usage:
 *   const t = useTranslation();
 *   t('home.searchPlaceholder');
 *   t(`tools.${tool.id}.name`, tool.name); // fallback to tool.name if missing
 */
export function useTranslation() {
  const locale = useUIStore((s) => s.locale);
  const dict = LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE];
  const fallbackDict = LOCALES[DEFAULT_LOCALE];

  return (key: string, fallback?: string): string => {
    if (dict[key] !== undefined) return dict[key];
    if (fallback !== undefined) return fallback;
    if (fallbackDict[key] !== undefined) return fallbackDict[key];
    return key;
  };
}
