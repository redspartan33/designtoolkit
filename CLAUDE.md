# DesignKit - Guía para Claude / Agentes de IA

## Comandos del Proyecto
- **Instalar dependencias**: `pnpm install`
- **Servidor de desarrollo**: `pnpm dev` (corre en http://localhost:3000)
- **Compilar producción**: `pnpm build`
- **Linter/Formatter**: `pnpm biome check --write`

## Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript.
- **Estilos**: Tailwind CSS v4, shadcn/ui (con `@base-ui/react` — **no tiene `asChild`**).
- **Iconos**: Lucide React.
- **Estado global**: Zustand + persist middleware (`lib/store.ts`).
- **Tipografía**: Geist Sans + Geist Mono (Google Fonts).
- **Almacenamiento**: Sin base de datos. Todo se procesa localmente (localStorage / IndexedDB). Privacidad total.

## Arquitectura de Navegación (Fase 8)

**No hay sidebar.** La navegación es 100% centrada en búsqueda.

- **Homepage** (`app/page.tsx`): barra de búsqueda prominente + pills de categoría + grid de herramientas ordenado por las más usadas.
- **Tool pages**: layout full-width con header mínimo propio (botón `← D` para volver al home).
- **`app/layout.tsx`**: solo contiene `TooltipProvider`, `CommandPalette` y `Toaster`. Aplica `className="dark"` en `<html>` para forzar dark mode. No define estructura visual.
- **`CommandPalette`** (`⌘K`): disponible en todas las páginas, herramientas ordenadas por uso.

## Sistema de Temas
**Tema único, dark-only.** No hay multi-tema, no hay light mode, no hay toggle.

- `<html className="dark">` está hardcoded en `app/layout.tsx`.
- Las variables CSS viven en `:root` de `app/globals.css` — paleta inspirada en Joboost: fondo `#0c0814`, primario violeta `#8b5cf6`, acento crema `#f0e3c8`, radius base `1.5rem`.
- El gradiente ambiental purpúreo se pinta directamente en `body { background-image: ... }`.
- Las utilidades `.glass` y `.glass-panel` tienen una sola variante (no dependen del tema).
- Hay una utilidad `.sparkle` con animación `sparkle-twinkle` para los acentos decorativos del home.

Si necesitas reintroducir múltiples temas, hay que reescribir `globals.css`, `app/layout.tsx`, `lib/store.ts` y volver a meter un `StyleProvider`.

## Store (`lib/store.ts`)
```ts
// Persisted:
toolUsageCounts: Record<string, number>   // incrementa al entrar a cada tool

// Session only:
commandPaletteOpen: boolean
```

## Tools Registry (`lib/tools-registry.ts`)
Única fuente de verdad. Para añadir una herramienta:
1. Crear `app/tools/[nombre]/page.tsx` usando `<ToolPageShell toolId="nombre">`.
2. Añadir entrada al array en `lib/tools-registry.ts`.
3. Si la categoría es nueva, añadirla al tipo `ToolCategory` en `lib/types.ts` **y** al array `CATEGORIES` en `app/page.tsx`.

## Categorías de herramientas
Las categorías reflejan el rol del usuario, no el tipo de asset. **Siempre** añadir nuevas categorías al tipo `ToolCategory` en `lib/types.ts` **y** al array `CATEGORIES` en `app/page.tsx`.

| Categoría | Descripción | Herramientas |
|-----------|-------------|-------------|
| `Branding` | Identidad visual y voz de marca | palette-extractor, color-scale-generator, gradient-generator, favicon-generator, copy-assistant |
| `UX` | Experiencia de usuario, flujos y presentación | heatmap-analyzer, journey-map, mockup-generator |
| `UI` | Assets visuales y sistemas de diseño | contrast-checker, typography-scale, spacing-scale, redline-spec, placeholder-generator, lorem-ipsum, background-remover, image-compressor, format-converter, image-upscaler, svg-optimizer, icon-finder |
| `Research` | Validación con usuarios y análisis de datos | usability-script, assumption-mapper, text-analyzer, ab-test-calculator |
| `Product Management` | Planificación, priorización y documentación | brief-builder, rice-scorer, qr-generator, case-converter, markdown-previewer |

## Inventario completo de herramientas (Doble Diamante)

**Fase 1 — Entender el problema**
- `brief-builder` (PM): Wizard de 6 pasos → design brief `.md`

**Fase 2 — Explorar & validar**
- `journey-map` (UX): Mapa de viaje con curva emocional SVG, touchpoints, pain points, oportunidades
- `assumption-mapper` (Research): Matriz 2×2 impacto × certeza con notas y vista lista
- `usability-script` (Research): Guiones de test de usabilidad con tareas, escenarios y secciones de preguntas

**Fase 3 — Diseñar para escala**
- `typography-scale` (UI): Ratios modulares (Minor 2nd → Golden Ratio), exporta CSS/JSON
- `spacing-scale` (UI): Múltiplos o Fibonacci, exporta CSS/Tailwind/JSON
- `redline-spec` (UI): Especificaciones de handoff con espaciado, tipografía, colores y componentes

**Fase 4 — Lanzar & iterar**
- `ab-test-calculator` (Research): Significancia estadística + calculadora de tamaño de muestra
- `rice-scorer` (PM): Priorización RICE con panel de detalle expandible y exportación `.md`

**Assets & utilidades visuales**
- `icon-finder` (UI): Buscador de iconos sobre la API pública de [Iconify](https://iconify.design) (Lucide, Heroicons, Tabler, Phosphor, Material Symbols, MDI, Bootstrap, Remix, Iconoir, Simple Icons). Preview con tamaño/color, copy SVG/JSX, descarga `.svg`. Atajo `⌘C` para copiar. Marcado `privacy: 'server'` porque requiere red. El grid usa `mask-image` CSS apuntando al endpoint `.svg` para que cada icono herede `currentColor`.

## `ToolPageShell` (`components/tools/tool-page-shell.tsx`)
- Es un **Client Component** (`'use client'`).
- Llama a `incrementToolUsage(tool.id)` en `useEffect` al montar.
- Renderiza su propio header con botón de regreso y nombre de la herramienta.
- El contenido se envuelve en `max-w-6xl mx-auto px-4 sm:px-6 py-8`.
- **Todas las páginas de herramientas deben usar este componente.**

## Reglas de Desarrollo
- No hay sidebar ni nav lateral. No los reintroduzcas.
- **shadcn/ui aquí usa `@base-ui/react`**: `DropdownMenuTrigger` y `TooltipTrigger` NO tienen prop `asChild`.
- Preguntar antes de instalar dependencias nuevas o ejecutar comandos destructivos.
- Mantener modularidad: cada herramienta es autocontenida en `app/tools/[nombre]`.
- Al terminar cambios relevantes, actualizar este archivo.

## Microservicio (Heatmap)
- **Ruta**: `/microservice/`
- **Levantar**: `cd microservice && source venv/bin/activate && python main.py`
- **Dependencias Python**: OpenCV (contrib), FastAPI, NumPy.
