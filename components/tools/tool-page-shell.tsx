"use client";

import { ArrowLeft, Lock, Server } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useUIStore } from "@/lib/store";
import { toolsRegistry } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

interface ToolPageShellProps {
  toolId: string;
  children: React.ReactNode;
}

export function ToolPageShell({ toolId, children }: ToolPageShellProps) {
  const t = useTranslation();
  const tool = toolsRegistry.find((it) => it.id === toolId);
  const { incrementToolUsage } = useUIStore();

  useEffect(() => {
    if (tool) incrementToolUsage(tool.id);
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool?.id]);

  if (!tool) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <h2 className="text-xl font-bold">{t("tool.notFound")}</h2>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← {t("common.back")}
        </Link>
      </div>
    );
  }

  const Icon = tool.icon;
  const name = t(`tools.${tool.id}.name`, tool.name);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Tool header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="px-4 sm:px-6 h-14 flex items-center gap-3">
          {/* Back */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 mr-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <div className="size-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
              D
            </div>
          </Link>

          <div className="h-4 w-px bg-border/60 shrink-0" />

          {/* Tool identity */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-sm truncate">{name}</span>

            {/* Status badge */}
            {tool.status === "beta" && (
              <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                {t("status.beta")}
              </span>
            )}

            {/* Privacy badge */}
            <span
              className={cn(
                "hidden sm:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground shrink-0",
              )}
            >
              {tool.privacy === "local" ? (
                <>
                  <Lock className="h-2.5 w-2.5" />
                  {t("privacy.local")}
                </>
              ) : (
                <>
                  <Server className="h-2.5 w-2.5" />
                  {t("privacy.server")}
                </>
              )}
            </span>
          </div>

          <div className="ml-auto shrink-0">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Full-width content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
