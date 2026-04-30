"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Copy, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Unit = "px" | "rem" | "pt" | "%";
type FontWeight = "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

interface SpacingEntry { id: string; label: string; top: string; right: string; bottom: string; left: string; unit: Unit }
interface TypographyEntry { id: string; label: string; size: string; weight: FontWeight; lineHeight: string; letterSpacing: string; color: string }
interface ColorEntry { id: string; label: string; hex: string; usage: string }
interface ComponentEntry { id: string; name: string; width: string; height: string; radius: string; notes: string }

function uid() { return Math.random().toString(36).slice(2, 8); }

const UNITS: Unit[] = ["px", "rem", "pt", "%"];
const WEIGHTS: FontWeight[] = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];

// ─── Export ───────────────────────────────────────────────────────────────────

function generateSpec(data: {
  componentName: string;
  description: string;
  platform: string;
  spacings: SpacingEntry[];
  typography: TypographyEntry[];
  colors: ColorEntry[];
  components: ComponentEntry[];
  notes: string;
}): string {
  const date = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  const spacingTable = data.spacings.length
    ? `## Espaciado\n\n| Elemento | Top | Right | Bottom | Left |\n|---------|-----|-------|--------|------|\n${data.spacings.map((s) => `| ${s.label} | ${s.top}${s.unit} | ${s.right}${s.unit} | ${s.bottom}${s.unit} | ${s.left}${s.unit} |`).join("\n")}`
    : "";

  const typographyTable = data.typography.length
    ? `## Tipografía\n\n| Elemento | Tamaño | Peso | Line-height | Letter-spacing | Color |\n|---------|--------|------|------------|----------------|-------|\n${data.typography.map((t) => `| ${t.label} | ${t.size} | ${t.weight} | ${t.lineHeight} | ${t.letterSpacing} | ${t.color} |`).join("\n")}`
    : "";

  const colorsSection = data.colors.length
    ? `## Colores\n\n${data.colors.map((c) => `- **${c.label}** — \`${c.hex}\` — ${c.usage}`).join("\n")}`
    : "";

  const componentsSection = data.components.length
    ? `## Componentes / Medidas\n\n${data.components
        .map(
          (c) =>
            `### ${c.name}\n- **Ancho:** ${c.width || "—"}\n- **Alto:** ${c.height || "—"}\n- **Border radius:** ${c.radius || "—"}\n${c.notes ? `- **Notas:** ${c.notes}` : ""}`
        )
        .join("\n\n")}`
    : "";

  return `# Redline Spec — ${data.componentName || "Componente sin nombre"}

**Plataforma:** ${data.platform || "—"}
**Fecha:** ${date}
**Descripción:** ${data.description || "—"}

---

${spacingTable}

${spacingTable && typographyTable ? "---\n\n" : ""}${typographyTable}

${typographyTable && colorsSection ? "---\n\n" : ""}${colorsSection}

${colorsSection && componentsSection ? "---\n\n" : ""}${componentsSection}

${data.notes ? `---\n\n## Notas de implementación\n\n${data.notes}` : ""}

---
*Generado con DesignKit — Redline Spec*`
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

const PLATFORMS = ["Web", "iOS", "Android", "React Native", "Flutter", "Otro"];
const DEFAULT_UNIT: Unit = "px";

export default function RedlineSpecPage() {
  const [componentName, setComponentName] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("Web");
  const [notes, setNotes] = useState("");

  const [spacings, setSpacings] = useState<SpacingEntry[]>([
    { id: uid(), label: "Padding interno", top: "16", right: "16", bottom: "16", left: "16", unit: "px" },
  ]);
  const [typography, setTypography] = useState<TypographyEntry[]>([
    { id: uid(), label: "Título", size: "24px", weight: "700", lineHeight: "1.3", letterSpacing: "0", color: "#111827" },
    { id: uid(), label: "Cuerpo", size: "16px", weight: "400", lineHeight: "1.5", letterSpacing: "0", color: "#374151" },
  ]);
  const [colors, setColors] = useState<ColorEntry[]>([
    { id: uid(), label: "Primario", hex: "#6366F1", usage: "CTAs y elementos de acción" },
  ]);
  const [components, setComponents] = useState<ComponentEntry[]>([
    { id: uid(), name: "Botón primario", width: "auto", height: "44px", radius: "8px", notes: "Min width 120px" },
  ]);

  const [tab, setTab] = useState<"spacing" | "typography" | "colors" | "components">("spacing");
  const [view, setView] = useState<"editor" | "preview">("editor");
  const [copied, setCopied] = useState(false);

  const exportText = generateSpec({ componentName, description, platform, spacings, typography, colors, components, notes });

  function handleCopy() {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([exportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spec-${(componentName || "componente").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Generic CRUD helpers
  function addSpacing() { setSpacings((p) => [...p, { id: uid(), label: "", top: "0", right: "0", bottom: "0", left: "0", unit: DEFAULT_UNIT }]); }
  function updateSpacing(id: string, patch: Partial<SpacingEntry>) { setSpacings((p) => p.map((s) => s.id === id ? { ...s, ...patch } : s)); }
  function removeSpacing(id: string) { setSpacings((p) => p.filter((s) => s.id !== id)); }

  function addTypo() { setTypography((p) => [...p, { id: uid(), label: "", size: "16px", weight: "400", lineHeight: "1.5", letterSpacing: "0", color: "#000000" }]); }
  function updateTypo(id: string, patch: Partial<TypographyEntry>) { setTypography((p) => p.map((t) => t.id === id ? { ...t, ...patch } : t)); }
  function removeTypo(id: string) { setTypography((p) => p.filter((t) => t.id !== id)); }

  function addColor() { setColors((p) => [...p, { id: uid(), label: "", hex: "#000000", usage: "" }]); }
  function updateColor(id: string, patch: Partial<ColorEntry>) { setColors((p) => p.map((c) => c.id === id ? { ...c, ...patch } : c)); }
  function removeColor(id: string) { setColors((p) => p.filter((c) => c.id !== id)); }

  function addComponent() { setComponents((p) => [...p, { id: uid(), name: "", width: "", height: "", radius: "", notes: "" }]); }
  function updateComponent(id: string, patch: Partial<ComponentEntry>) { setComponents((p) => p.map((c) => c.id === id ? { ...c, ...patch } : c)); }
  function removeComponent(id: string) { setComponents((p) => p.filter((c) => c.id !== id)); }

  const SECTION_TABS = [
    { id: "spacing" as const, label: "Espaciado", count: spacings.length },
    { id: "typography" as const, label: "Tipografía", count: typography.length },
    { id: "colors" as const, label: "Colores", count: colors.length },
    { id: "components" as const, label: "Componentes", count: components.length },
  ];

  return (
    <ToolPageShell toolId="redline-spec">
      {/* View toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 p-1 glass-panel rounded-xl border border-border/40 w-fit">
          {(["editor", "preview"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "editor" ? "Editor" : "Preview"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" /> .md
          </Button>
        </div>
      </div>

      {view === "preview" ? (
        <pre className="glass-panel rounded-2xl p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-[75vh] border border-border/40">
          {exportText}
        </pre>
      ) : (
        <div className="space-y-6">
          {/* Header fields */}
          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-4">
            <h3 className="font-bold">Información general</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre del componente / pantalla">
                <Input placeholder="Ej. Botón primario, Modal de confirmación" value={componentName} onChange={(e) => setComponentName(e.target.value)} />
              </Field>
              <Field label="Plataforma">
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs border transition-colors",
                        platform === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Descripción">
              <Textarea rows={2} placeholder="¿Qué es este componente? ¿Dónde se usa?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 p-1 glass-panel rounded-xl border border-border/40 w-fit flex-wrap">
            {SECTION_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", tab === t.id ? "bg-white/20" : "bg-muted text-muted-foreground")}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* Spacing */}
          {tab === "spacing" && (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_40px] gap-2 px-1 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <span>Elemento</span><span className="text-center">Top</span><span className="text-center">Right</span><span className="text-center">Bottom</span><span className="text-center">Left</span><span className="text-center">Unidad</span><span />
              </div>
              {spacings.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_40px] gap-2 items-center">
                  <Input placeholder="Ej. Padding botón" value={s.label} onChange={(e) => updateSpacing(s.id, { label: e.target.value })} />
                  {(["top", "right", "bottom", "left"] as const).map((side) => (
                    <Input key={side} type="number" min={0} value={s[side]} onChange={(e) => updateSpacing(s.id, { [side]: e.target.value })} className="font-mono text-center" />
                  ))}
                  <select value={s.unit} onChange={(e) => updateSpacing(s.id, { unit: e.target.value as Unit })} className="h-9 rounded-md border border-input bg-background px-2 text-sm font-mono">
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => removeSpacing(s.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSpacing} className="border-dashed"><Plus className="h-4 w-4" /> Agregar</Button>
            </div>
          )}

          {/* Typography */}
          {tab === "typography" && (
            <div className="space-y-3">
              {typography.map((t) => (
                <div key={t.id} className="glass-panel rounded-xl p-4 border border-border/40 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Field label="Elemento">
                    <Input placeholder="Título, Cuerpo, Caption..." value={t.label} onChange={(e) => updateTypo(t.id, { label: e.target.value })} />
                  </Field>
                  <Field label="Tamaño">
                    <Input placeholder="16px" value={t.size} onChange={(e) => updateTypo(t.id, { size: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Peso">
                    <select value={t.weight} onChange={(e) => updateTypo(t.id, { weight: e.target.value as FontWeight })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-mono">
                      {WEIGHTS.map((w) => <option key={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label="Line-height">
                    <Input placeholder="1.5" value={t.lineHeight} onChange={(e) => updateTypo(t.id, { lineHeight: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Letter-spacing">
                    <Input placeholder="0" value={t.letterSpacing} onChange={(e) => updateTypo(t.id, { letterSpacing: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Color">
                    <div className="flex gap-2">
                      <input type="color" value={t.color} onChange={(e) => updateTypo(t.id, { color: e.target.value })} className="h-9 w-10 rounded-md border border-input p-0.5 cursor-pointer" />
                      <Input value={t.color} onChange={(e) => updateTypo(t.id, { color: e.target.value })} className="font-mono uppercase flex-1" />
                    </div>
                  </Field>
                  <div className="sm:col-span-3 flex items-center justify-between">
                    <p className="text-sm" style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: t.lineHeight, letterSpacing: t.letterSpacing, color: t.color }}>
                      {t.label || "Vista previa"}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => removeTypo(t.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addTypo} className="border-dashed"><Plus className="h-4 w-4" /> Agregar</Button>
            </div>
          )}

          {/* Colors */}
          {tab === "colors" && (
            <div className="space-y-3">
              {colors.map((c) => (
                <div key={c.id} className="glass-panel rounded-xl p-4 border border-border/40 grid grid-cols-[1fr_1fr_2fr_40px] gap-3 items-center">
                  <Field label="Nombre">
                    <Input placeholder="Primario, Fondo..." value={c.label} onChange={(e) => updateColor(c.id, { label: e.target.value })} />
                  </Field>
                  <Field label="Color">
                    <div className="flex gap-2">
                      <input type="color" value={c.hex} onChange={(e) => updateColor(c.id, { hex: e.target.value })} className="h-9 w-10 rounded-md border border-input p-0.5 cursor-pointer" />
                      <Input value={c.hex} onChange={(e) => updateColor(c.id, { hex: e.target.value })} className="font-mono uppercase" />
                    </div>
                  </Field>
                  <Field label="Uso">
                    <Input placeholder="Botones primarios, fondos de card..." value={c.usage} onChange={(e) => updateColor(c.id, { usage: e.target.value })} />
                  </Field>
                  <Button variant="ghost" size="sm" className="self-end mb-0.5" onClick={() => removeColor(c.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addColor} className="border-dashed"><Plus className="h-4 w-4" /> Agregar</Button>
            </div>
          )}

          {/* Components */}
          {tab === "components" && (
            <div className="space-y-3">
              {components.map((c) => (
                <div key={c.id} className="glass-panel rounded-xl p-4 border border-border/40 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Field label="Nombre">
                    <Input placeholder="Botón, Input, Card..." value={c.name} onChange={(e) => updateComponent(c.id, { name: e.target.value })} />
                  </Field>
                  <Field label="Ancho">
                    <Input placeholder="320px, 100%..." value={c.width} onChange={(e) => updateComponent(c.id, { width: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Alto">
                    <Input placeholder="44px, auto..." value={c.height} onChange={(e) => updateComponent(c.id, { height: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Border radius">
                    <Input placeholder="8px, 50%..." value={c.radius} onChange={(e) => updateComponent(c.id, { radius: e.target.value })} className="font-mono" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Notas">
                      <Input placeholder="Min-width, estados, variantes..." value={c.notes} onChange={(e) => updateComponent(c.id, { notes: e.target.value })} />
                    </Field>
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => removeComponent(c.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addComponent} className="border-dashed"><Plus className="h-4 w-4" /> Agregar</Button>
            </div>
          )}

          {/* Global notes */}
          <div className="glass-panel rounded-2xl p-6 border border-border/40 space-y-3">
            <h3 className="font-bold">Notas de implementación</h3>
            <Textarea
              rows={4}
              placeholder={`- Usar la variable --color-primary del design token\n- Los estados hover y focus son responsabilidad de ingeniería\n- Revisar guía de accesibilidad antes de implementar`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}
