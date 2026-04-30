# DesignKit - Guía para Claude / Agentes de IA

## Comandos del Proyecto
- **Instalar dependencias**: `pnpm install`
- **Servidor de desarrollo**: `pnpm dev`
- **Compilar producción**: `pnpm build`
- **Linter/Formatter**: `pnpm biome check --write`

## Estructura y Arquitectura
- **Framework**: Next.js 15 (App Router), React 19, TypeScript.
- **Estilos**: Tailwind CSS v4, shadcn/ui.
- **Iconos**: Lucide React.
- **Almacenamiento**: Sin base de datos (se usa `localStorage` o `IndexedDB` en el cliente). Todo el procesamiento debe ser local para mantener privacidad y velocidad.
- **Tools Registry**: Única fuente de verdad en `lib/tools-registry.ts`. Para añadir una nueva herramienta, crear su ruta en `app/tools/[nombre]/page.tsx` y añadirla a este registry.
- **Diseño UI**: Minimalista, parecido a Vercel/Linear. Mucho whitespace, tipografía Geist.

## Reglas de Desarrollo
- Mantener la modularidad: Las herramientas deben ser componentes autocontenidos en `app/tools/[nombre]`.
- Envolver todas las páginas de herramientas en el componente `ToolPageShell`.
- Preguntar antes de ejecutar comandos destructivos o de instalar paquetes pesados.
- Explicar brevemente las decisiones de arquitectura.
- No modificar librerías o dependencias sin la aprobación del usuario.
- Trabajar en pasos incrementales y reportar avances clave.

## Fase Actual: Fase 8 - UI Overhaul & Multi-Theme Expansion
- **Temas disponibles** (5 en total, `lib/store.ts` tipo `VisualStyle`):
  - `nature` → Glass Nature (glassmorphic verde/teal, gradientes dinámicos)
  - `earth` → Bento Earth (cajas sólidas, tierra cálida, radius grande)
  - `aurora` → Glass Aurora (glassmorphic púrpura/teal aurora boreal) ✨ NUEVO
  - `cyber` → Neon Cyber (terminal oscuro, neon verde #00ff88, radius sharp) ✨ NUEVO
  - `ocean` → Ocean (azul marino, limpio y profesional, radius 1rem) ✨ NUEVO
- **Arquitectura de temas**: Variables CSS en `app/globals.css`. Clases `glass` y `glass-panel` con variantes por tema. Fondos degradados directamente en `body.theme-*`.
- **Navegación mejorada**:
  - `CommandPalette` (⌘K): búsqueda rápida con navegación por teclado, historial de recientes.
  - `Sidebar` colapsable: modo icono (72px) o expandido (240px), persiste en Zustand.
  - `MobileNav`: barra inferior fija en mobile (< lg), con accesos directos por categoría.
  - `Header`: breadcrumbs del tool activo, trigger de ⌘K, manager de temas.
- **Store** (`lib/store.ts`): `visualStyle`, `sidebarCollapsed`, `commandPaletteOpen`, `recentToolIds` (últimos 6).
- **Dependencias previas**: `@mlc-ai/web-llm` (IA Local), `zustand` (Estado), `next-themes` (Modo oscuro/claro extendido).

## Microservicio (Heatmap)
- **Ruta**: `/microservice/`
- **Levantar**: `cd microservice && source venv/bin/activate && python main.py`
- **Dependencias**: OpenCV (contrib), FastAPI, NumPy.
