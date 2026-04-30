import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { toolsRegistry } from "@/lib/tools-registry";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ToolPageShellProps {
  toolId: string;
  children: React.ReactNode;
}

export function ToolPageShell({ toolId, children }: ToolPageShellProps) {
  const tool = toolsRegistry.find((t) => t.id === toolId);

  if (!tool) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Herramienta no encontrada</h2>
        <Link href="/" className="text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const Icon = tool.icon;

  return (
    <div className="flex flex-col space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="flex items-center hover:text-foreground">
          <Home className="mr-1 h-3 w-3" />
          Inicio
        </Link>
        <ChevronRight className="mx-1 h-3 w-3" />
        <span className="font-medium text-foreground">{tool.category}</span>
        <ChevronRight className="mx-1 h-3 w-3" />
        <span className="font-medium text-foreground">{tool.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 rounded-lg bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
            <p className="mt-1 text-lg text-muted-foreground">
              {tool.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{tool.privacy === "local" ? "Local" : "Server"}</Badge>
          {tool.status === "beta" && <Badge className="bg-blue-500">Beta</Badge>}
          {tool.status === "coming-soon" && <Badge variant="secondary">Pronto</Badge>}
        </div>
      </div>

      <Separator />

      {/* Content Area */}
      <div className="min-h-[400px] rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
