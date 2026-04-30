'use client';

import { useState } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw, Type, CaseSensitive } from 'lucide-react';
import { toast } from 'sonner';

export default function CaseConverterPage() {
  const [text, setText] = useState('');

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const convert = (type: string) => {
    if (!text) return;
    let result = '';
    switch (type) {
      case 'upper': result = text.toUpperCase(); break;
      case 'lower': result = text.toLowerCase(); break;
      case 'title': result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()); break;
      case 'sentence': result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(); break;
      case 'camel': result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, ''); break;
      case 'snake': result = text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase()).join('_') || ''; break;
      case 'pascal': result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, ''); break;
      case 'kebab': result = text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)?.map(x => x.toLowerCase()).join('-') || ''; break;
    }
    setText(result);
  };

  return (
    <ToolPageShell toolId="case-converter">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Type className="w-4 h-4" /> Texto a convertir
            </Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setText('')}>
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Limpiar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5 mr-2" /> Copiar
              </Button>
            </div>
          </div>
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            placeholder="Pega aquí el texto que quieras transformar..."
            className="min-h-[250px] text-lg font-medium resize-y p-6 rounded-2xl bg-muted/10 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button variant="secondary" onClick={() => convert('upper')}>MAYÚSCULAS</Button>
          <Button variant="secondary" onClick={() => convert('lower')}>minúsculas</Button>
          <Button variant="secondary" onClick={() => convert('title')}>Title Case</Button>
          <Button variant="secondary" onClick={() => convert('sentence')}>Sentence case</Button>
          <Button variant="secondary" onClick={() => convert('camel')} className="font-mono">camelCase</Button>
          <Button variant="secondary" onClick={() => convert('snake')} className="font-mono">snake_case</Button>
          <Button variant="secondary" onClick={() => convert('pascal')} className="font-mono">PascalCase</Button>
          <Button variant="secondary" onClick={() => convert('kebab')} className="font-mono">kebab-case</Button>
        </div>

        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CaseSensitive className="w-5 h-5 text-primary" /> ¿Por qué usar un convertidor?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mantener la consistencia en el código y el contenido es vital. Usa <strong>camelCase</strong> para variables, <strong>snake_case</strong> para bases de datos, y <strong>Title Case</strong> para encabezados. Este toolkit te ayuda a formatear strings rápidamente sin errores manuales.
          </p>
        </div>
      </div>
    </ToolPageShell>
  );
}
