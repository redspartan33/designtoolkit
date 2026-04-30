'use client';

import { useState } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Edit3, Copy, Download, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

const DEFAULT_MARKDOWN = `# Hola Mundo
Este es un **previsualizador de Markdown** local y privado.

## Funcionalidades
- [x] Soporte para GFM (GitHub Flavored Markdown)
- [x] Tablas, listas y enlaces
- [x] Código: \`const hello = "world";\`

### Tablas de ejemplo
| Herramienta | Categoría | Estado |
| :--- | :--- | :--- |
| Mockups | Layout | ✅ Stable |
| Placeholders | Layout | ✅ Stable |
| Markdown | Escritura | ✅ Stable |

> "Escribir es la pintura de la voz." - Voltaire
`;

export default function MarkdownPreviewerPage() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    toast.success('Markdown copiado');
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'documento.md';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo .md descargado');
  };

  return (
    <ToolPageShell toolId="markdown-previewer">
      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs defaultValue="editor" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-2 w-[300px]">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" /> Vista Previa
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5 mr-2" /> Copiar
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5 mr-2" /> Descargar .md
              </Button>
            </div>
          </div>

          <TabsContent value="editor" className="mt-0">
            <div className="rounded-2xl border bg-card overflow-hidden">
              <Textarea 
                value={markdown} 
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Escribe tu markdown aquí..."
                className="min-h-[600px] border-none focus-visible:ring-0 text-lg font-mono p-8 resize-none bg-transparent"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <div className="rounded-2xl border bg-card p-8 min-h-[600px] bg-slate-50 dark:bg-slate-950/50">
              <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-code:text-primary prose-img:rounded-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </article>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 rounded-xl border bg-muted/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Consejo de Diseño</h4>
            <p className="text-sm text-muted-foreground">
              Usa Markdown para documentar tus componentes y guías de estilo. Es el estándar de oro para la documentación técnica y se integra perfectamente con herramientas como GitHub, Notion y Obsidian.
            </p>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
