"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toolsRegistry } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
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
    <div className={cn("hidden lg:block lg:w-64 shrink-0 overflow-hidden", className)}>
      <div className="flex h-full max-h-screen flex-col gap-4">
        <div className="flex h-16 items-center px-8">
          <Link href="/" className="flex items-center gap-3 font-bold">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <span className="text-xl">D</span>
            </div>
            <span className="text-xl tracking-tight">DesignKit</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 gap-1 text-sm font-medium">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-[1.25rem] px-4 py-3 transition-all duration-300",
                pathname === "/" 
                  ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" 
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
            >
              Dashboard
            </Link>

            {Object.entries(categories).map(([category, tools]) => (
              <div key={category} className="mt-8 space-y-1">
                <h4 className="mb-2 px-4 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
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
                        "group flex items-center gap-3 rounded-[1.25rem] px-4 py-3 transition-all duration-300",
                        isActive 
                          ? "[.theme-nature_&]:bg-white/20 [.theme-nature_&]:backdrop-blur-md [.theme-earth_&]:bg-accent [.theme-earth_&]:text-accent-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl transition-all duration-300",
                        isActive ? "bg-primary/10" : "group-hover:bg-primary/5"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold tracking-tight">{tool.name}</span>
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
