import Link from "next/link";
import { Tool } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const isComingSoon = tool.status === "coming-soon";
  const href = isComingSoon ? `/tools/coming-soon?id=${tool.id}` : tool.route;

  return (
    <Link href={href}>
      <div
        className={cn(
          "glass h-full rounded-[2.5rem] transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl p-6 flex flex-col gap-4",
          "[.theme-nature_&]:border-white/20 [.theme-nature_&]:hover:bg-white/50 [.theme-nature_&]:dark:hover:bg-black/50",
          "[.theme-earth_&]:border-border [.theme-earth_&]:hover:bg-white [.theme-earth_&]:dark:hover:bg-white/5",
          isComingSoon && "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-2xl p-3 shadow-lg transition-colors duration-500",
              "[.theme-nature_&]:bg-primary [.theme-nature_&]:text-primary-foreground",
              "[.theme-earth_&]:bg-accent [.theme-earth_&]:text-accent-foreground"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">{tool.name}</h3>
          </div>
          {isComingSoon && (
            <Badge variant="secondary" className="text-[10px] uppercase rounded-full">
              Pronto
            </Badge>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {tool.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] rounded-full px-3 py-0.5 [.theme-nature_&]:bg-white/20 [.theme-nature_&]:border-white/20 [.theme-earth_&]:bg-secondary/50">
            {tool.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] rounded-full px-3 py-0.5 [.theme-nature_&]:bg-white/20 [.theme-nature_&]:border-white/20 [.theme-earth_&]:bg-secondary/50">
            {tool.privacy === "local" ? "Local" : "Server"}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
