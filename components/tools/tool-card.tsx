import Link from "next/link";
import { Tool } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lock, Server, ArrowRight } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  stable: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  beta: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "coming-soon": "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  stable: "Estable",
  beta: "Beta",
  "coming-soon": "Pronto",
};

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const isComingSoon = tool.status === "coming-soon";
  const href = isComingSoon ? `/tools/coming-soon?id=${tool.id}` : tool.route;

  return (
    <Link href={href} className={cn("group block h-full", isComingSoon && "pointer-events-auto")}>
      <div
        className={cn(
          "glass h-full rounded-2xl transition-all duration-300 p-5 flex flex-col gap-4",
          "hover:shadow-xl hover:-translate-y-0.5",
          isComingSoon && "opacity-60 grayscale-[0.4] hover:opacity-90 hover:grayscale-0"
        )}
      >
        {/* Icon + title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight leading-tight">{tool.name}</h3>
              <span className="text-[10px] font-medium text-muted-foreground/60">
                {tool.category}
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5" />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
          {tool.description}
        </p>

        {/* Footer badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
              STATUS_STYLES[tool.status]
            )}
          >
            {STATUS_LABELS[tool.status]}
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
            {tool.privacy === "local" ? (
              <>
                <Lock className="h-2.5 w-2.5" />
                Local
              </>
            ) : (
              <>
                <Server className="h-2.5 w-2.5" />
                Server
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
