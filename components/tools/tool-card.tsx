"use client";

import { ArrowRight, Lock, Server } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { Tool } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  stable: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  beta: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "coming-soon": "bg-muted text-muted-foreground",
};

export function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  const t = useTranslation();
  const Icon = tool.icon;
  const isComingSoon = tool.status === "coming-soon";
  const href = isComingSoon ? `/tools/coming-soon?id=${tool.id}` : tool.route;
  const name = t(`tools.${tool.id}.name`, tool.name);
  const description = t(`tools.${tool.id}.description`, tool.description);

  return (
    <Link
      href={href}
      className="group block card-appear"
      style={{ animationDelay: `${Math.min(index * 25, 400)}ms` }}
    >
      <div
        className={cn(
          "glass h-full rounded-2xl transition-all duration-300 p-5 flex flex-col gap-4",
          "hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.01]",
          isComingSoon &&
            "opacity-55 grayscale-[0.3] hover:opacity-90 hover:grayscale-0",
        )}
      >
        {/* Icon + title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight leading-tight">
                {name}
              </h3>
              <span className="text-[10px] font-medium text-muted-foreground/60">
                {t(`category.${tool.category}`, tool.category)}
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/25 shrink-0 mt-0.5 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5" />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
              STATUS_STYLES[tool.status],
            )}
          >
            {t(`status.${tool.status}`)}
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
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
      </div>
    </Link>
  );
}
