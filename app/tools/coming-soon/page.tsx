import { ToolPageShell } from "@/components/tools/tool-page-shell";

// Note: Next.js 15 searchParams in Server Components requires awaiting it.
// To avoid dealing with that complexity for a simple placeholder,
// we can make it a Client Component or just render a generic message if we don't know the ID.
// However, since it's a Server Component by default, let's use a simpler approach.
export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedParams = await searchParams;
  const id = resolvedParams.id || "unknown";

  return (
    <ToolPageShell toolId={id}>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-muted p-6 text-muted-foreground">
          <svg
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Esta herramienta está en camino</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Estamos trabajando duro para traer esta funcionalidad pronto. 
          Vuelve más adelante para ver las novedades.
        </p>
      </div>
    </ToolPageShell>
  );
}
