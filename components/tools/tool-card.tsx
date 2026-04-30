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
      <Card
        className={cn(
          "h-full transition-all hover:shadow-md hover:border-primary/50",
          isComingSoon && "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-medium">{tool.name}</CardTitle>
          </div>
          {isComingSoon && (
            <Badge variant="secondary" className="text-[10px] uppercase">
              Pronto
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2 min-h-[2.5rem]">
            {tool.description}
          </CardDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {tool.category}
            </Badge>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {tool.privacy === "local" ? "Local" : "Server"}
            </Badge>
            {tool.status === "beta" && (
              <Badge variant="default" className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white">
                Beta
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
