"use client";

import {
  Brain,
  Copy,
  HelpCircle,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Frameworks definitions
const FRAMEWORKS = [
  { id: "aida", name: "AIDA", description: "Atención, Interés, Deseo, Acción" },
  { id: "pas", name: "PAS", description: "Problema, Agitación, Solución" },
  { id: "fab", name: "FAB", description: "Features, Advantages, Benefits" },
  {
    id: "none",
    name: "Libre",
    description: "Escritura creativa sin estructura fija",
  },
];

const TONES = [
  { id: "persuasive", name: "Persuasivo" },
  { id: "professional", name: "Profesional" },
  { id: "friendly", name: "Amigable" },
  { id: "funny", name: "Divertido" },
  { id: "urgent", name: "Urgente" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function CopyAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [framework, setFramework] = useState("none");
  const [tone, setTone] = useState("persuasive");
  const [creativity, setCreativity] = useState(0.7);

  // AI State
  const [engine, setEngine] = useState<any>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const initAI = async () => {
    setIsModelLoading(true);
    setLoadProgress(0);
    try {
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      const selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

      const engine = await CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        selectedModel,
        {
          initProgressCallback: (report: any) => {
            setLoadProgress(Math.round(report.progress * 100));
          },
        },
      );

      setEngine(engine);
      setIsModelReady(true);
      toast.success("¡Cerebro local activado!");
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el modelo local.");
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    if (!isModelReady) {
      toast.info("Activa el Asistente IA primero.");
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsGenerating(true);

    try {
      const systemPrompt = `Eres un experto en copywriting senior. Tu objetivo es ayudar al usuario a rebotar ideas y perfeccionar textos publicitarios.
Configuración actual: Tono ${tone}, Framework ${framework.toUpperCase()}, Creatividad ${creativity}.
Mantén el contexto de la conversación. Responde de forma experta, concisa y creativa.`;

      const chatHistory = [
        { role: "system", content: systemPrompt },
        ...newMessages,
      ];

      const chunks = await engine.chat.completions.create({
        messages: chatHistory,
        temperature: creativity,
        stream: true,
      });

      let assistantResponse = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || "";
        assistantResponse += content;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantResponse;
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error en la generación.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado");
  };

  return (
    <ToolPageShell toolId="copy-assistant">
      <div className="flex flex-col h-[75vh] max-w-5xl mx-auto gap-6">
        {/* Header / Loading State */}
        {!isModelReady && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-8 glass rounded-[2.5rem] m-10 backdrop-blur-3xl shadow-2xl border-primary/20">
            <div className="max-w-md w-full space-y-6 text-center">
              <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight">
                  Activa tu Asistente Local
                </h2>
                <p className="text-muted-foreground">
                  Inicia una IA experta que vive en tu navegador. Privacidad
                  total, sin suscripciones.
                </p>
              </div>

              {isModelLoading ? (
                <div className="space-y-3">
                  <Progress value={loadProgress} className="h-3 rounded-full" />
                  <p className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">
                    Descargando cerebro: {loadProgress}%
                  </p>
                </div>
              ) : (
                <Button
                  onClick={initAI}
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-2xl hover:scale-[1.02] transition-all"
                >
                  <Zap className="w-5 h-5 mr-2" /> Iniciar Chat IA (600MB)
                </Button>
              )}
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                100% On-Device • WebGPU Required
              </p>
            </div>
          </div>
        )}

        {/* Chat History Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="p-6 rounded-[2rem] glass">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  ¡Hola! Soy tu experto en Copy.
                </p>
                <p className="text-sm max-w-sm">
                  Escribe una idea, un producto o un problema y lo puliremos
                  juntos.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                  m.role === "user"
                    ? "ml-auto items-end"
                    : "mr-auto items-start",
                )}
              >
                <div
                  className={cn(
                    "px-6 py-4 rounded-[2rem] text-lg leading-relaxed shadow-sm border transition-all duration-500",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none border-primary"
                      : "glass rounded-tl-none border-white/10",
                  )}
                >
                  {m.content || (
                    <div className="flex gap-1 py-2">
                      <div className="size-2 bg-primary rounded-full animate-bounce" />
                      <div className="size-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="size-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
                {m.role === "assistant" && m.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(m.content)}
                    className="mt-2 rounded-xl text-xs hover:bg-white/10"
                  >
                    <Copy className="w-3 h-3 mr-2" /> Copiar
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Smart Input Container */}
        <div className="relative group p-1 rounded-[3rem] shadow-2xl glass border-white/10 focus-within:border-primary/30 transition-all duration-500">
          {/* Settings Bar inside input */}
          <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-white/10 overflow-x-auto no-scrollbar">
            <Select
              value={framework}
              onValueChange={(v) => v && setFramework(v)}
            >
              <SelectTrigger className="h-8 w-fit rounded-full border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider px-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[8px] rounded-sm bg-primary/10 text-primary border-primary/20"
                  >
                    FMWK
                  </Badge>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tone} onValueChange={(v) => v && setTone(v)}>
              <SelectTrigger className="h-8 w-fit rounded-full border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider px-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[8px] rounded-sm bg-amber-500/10 text-amber-500 border-amber-500/20"
                  >
                    TONE
                  </Badge>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-8 flex items-center gap-4 px-4 bg-white/5 rounded-full border border-white/10 ml-auto">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Creatividad
              </span>
              <Slider
                className="w-24"
                value={[creativity]}
                min={0.1}
                max={1.2}
                step={0.1}
                onValueChange={(v) =>
                  setCreativity(Array.isArray(v) ? v[0] : v)
                }
              />
              <span className="text-[10px] font-mono text-primary font-bold">
                {(creativity * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Textarea Area */}
          <div className="flex items-end p-4 gap-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                (e.preventDefault(), handleSend())
              }
              placeholder="Pregunta algo o rebota una idea..."
              className="flex-1 min-h-[60px] max-h-[200px] bg-transparent border-none focus-visible:ring-0 text-lg resize-none py-4 px-4"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isGenerating || !input.trim()}
              className="size-12 rounded-[1.5rem] shadow-xl hover:scale-[1.05] transition-all shrink-0 bg-primary text-primary-foreground"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}
