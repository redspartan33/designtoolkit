'use client';

import { useState, useMemo } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Type, Clock, Hash, AlignLeft, Info } from 'lucide-react';

export default function TextAnalyzerPage() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const cleanText = text.trim();
    if (!cleanText) return { words: 0, chars: 0, charsNoSpace: 0, sentences: 0, readingTime: 0 };

    const words = cleanText.split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(words / 200);

    return { words, chars, charsNoSpace, sentences, readingTime };
  }, [text]);

  return (
    <ToolPageShell toolId="text-analyzer">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4 flex flex-col items-center justify-center space-y-2 bg-primary/5 border-primary/10">
            <Hash className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold font-mono">{stats.words}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Palabras</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center space-y-2">
            <Type className="w-5 h-5 text-muted-foreground" />
            <span className="text-2xl font-bold font-mono">{stats.chars}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Caracteres</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center space-y-2">
            <AlignLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-2xl font-bold font-mono">{stats.sentences}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Frases</span>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center space-y-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-2xl font-bold font-mono">{stats.readingTime} min</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Lectura</span>
          </Card>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium">Contenido a analizar</Label>
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            placeholder="Pega tu texto aquí para obtener estadísticas detalladas en tiempo real..."
            className="min-h-[400px] text-lg leading-relaxed p-8 rounded-2xl bg-muted/10 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border bg-card space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> Detalles adicionales
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Caracteres (sin espacios)</span>
                <span className="font-mono font-medium">{stats.charsNoSpace}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t pt-3">
                <span className="text-muted-foreground">Promedio palabra/frase</span>
                <span className="font-mono font-medium">
                  {stats.sentences > 0 ? (stats.words / stats.sentences).toFixed(1) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t pt-3">
                <span className="text-muted-foreground">Densidad de espacios</span>
                <span className="font-mono font-medium">
                  {stats.chars > 0 ? ((1 - stats.charsNoSpace / stats.chars) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-muted/20 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              "La brevedad es el alma del ingenio." — William Shakespeare. 
              <br /><br />
              Un buen microcopy suele tener entre 2 y 5 palabras por frase. Los párrafos de lectura rápida en web no deberían superar las 45-75 palabras para mantener la atención del usuario.
            </p>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
