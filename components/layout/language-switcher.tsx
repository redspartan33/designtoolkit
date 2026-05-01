"use client";

import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LANGUAGES: { code: Locale; labelKey: string; flag: string }[] = [
  { code: "es", labelKey: "lang.es", flag: "🇪🇸" },
  { code: "en", labelKey: "lang.en", flag: "🇬🇧" },
];

export function LanguageSwitcher() {
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);
  const t = useTranslation();
  const active = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl glass border-white/10 hover:bg-white/10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary text-xs font-bold uppercase tracking-wider"
        aria-label={t("lang.label")}
      >
        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{active.code}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 p-1.5 glass border-white/10 rounded-2xl"
      >
        <div className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          {t("lang.label")}
        </div>
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all text-sm",
              locale === lang.code
                ? "bg-primary text-primary-foreground"
                : "hover:bg-white/10",
            )}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span className="font-bold">{t(lang.labelKey)}</span>
            <span className="ml-auto text-[9px] uppercase tracking-wider opacity-70">
              {lang.code}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
