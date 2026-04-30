"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toolsRegistry } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  // Group tools by category
  const categories = toolsRegistry.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof toolsRegistry>);

  return (
    <div className="hidden border-r bg-muted/20 lg:block lg:w-64 shrink-0">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg tracking-tight">DesignKit</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === "/" ? "bg-muted text-primary" : ""
              )}
            >
              Dashboard
            </Link>

            {Object.entries(categories).map(([category, tools]) => (
              <div key={category} className="mt-4">
                <h4 className="mb-1 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </h4>
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = pathname === tool.route;
                  return (
                    <Link
                      key={tool.id}
                      href={tool.route}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive ? "bg-muted text-primary" : ""
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tool.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
