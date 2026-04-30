'use client';

import { useState } from 'react';
import { ToolPageShell } from '@/components/tools/tool-page-shell';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Copy, RefreshCw, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';

const LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export default function LoremIpsumPage() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'paragraphs' | 'words' | 'sentences'>('paragraphs');
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [generatedText, setGeneratedText] = useState("");

  const generate = () => {
    let result = "";
    const sentences = LOREM_TEXT.split(". ");
    const words = LOREM_TEXT.replace(/[.,]/g, "").split(" ");

    if (type === 'paragraphs') {
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        let p = LOREM_TEXT;
        if (i > 0) p = p.split(" ").sort(() => Math.random() - 0.5).join(" ");
        paragraphs.push(p);
      }
      result = paragraphs.join("\n\n");
    } else if (type === 'sentences') {
      const selected = [];
      for (let i = 0; i < count; i++) {
        selected.push(sentences[Math.floor(Math.random() * sentences.length)]);
      }
      result = selected.join(". ") + ".";
    } else {
      const selected = [];
      for (let i = 0; i < count; i++) {
        selected.push(words[Math.floor(Math.random() * words.length)]);
      }
      result = selected.join(" ");
    }

    if (startWithLorem && !result.toLowerCase().startsWith("lorem ipsum")) {
      result = "Lorem ipsum " + result.charAt(0).toLowerCase() + result.slice(1);
    }

    setGeneratedText(result);
  };

  const handleCopy = async () => {
    if (!generatedText) return;
    await navigator.clipboard.writeText(generatedText);
    toast.success('Texto copiado');
  };

  useState(() => {
    generate();
  });

  return (
    <ToolPageShell toolId="lorem-ipsum">
      <div className="grid md:grid-cols-[300px_1fr] gap-8 max-w-6xl mx-auto">
        {/* Controls */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border bg-card space-y-6">
            <div className="space-y-4">
              <Label>Generar por</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={type === 'paragraphs' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setType('paragraphs')}
                >
                  Párrafos
                </Button>
                <Button 
                  variant={type === 'sentences' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setType('sentences')}
                >
                  Frases
                </Button>
                <Button 
                  variant={type === 'words' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setType('words')}
                >
                  Palabras
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <Label>Cantidad</Label>
                <span className="font-mono font-medium">{count}</span>
              </div>
              <Slider 
                value={[count]} 
                min={1} max={50} step={1}
                onValueChange={(v) => setCount(Array.isArray(v) ? v[0] : v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="start-lorem">Empezar con "Lorem ipsum"</Label>
              <Switch 
                id="start-lorem" 
                checked={startWithLorem} 
                onCheckedChange={setStartWithLorem}
              />
            </div>

            <Button onClick={generate} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Regenerar
            </Button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-primary" /> Resultado
            </h3>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" /> Copiar Texto
            </Button>
          </div>

          <div className="p-8 rounded-2xl border bg-muted/10 min-h-[400px] prose prose-slate dark:prose-invert max-w-none">
            {generatedText.split("\n\n").map((p, i) => (
              <p key={i} className="mb-4 last:mb-0 leading-relaxed text-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
