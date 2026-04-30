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

## Fase Actual: Fase 7 - IA Assistant & Multi-Theme System
- **Novedades**:
  - **Asistente de Copy** (`copy-assistant`): Chatbot experto en copywriting que utiliza **Llama 3.2 1B** localmente vía WebGPU. Soporta frameworks (AIDA/PAS/FAB) y memoria de contexto.
  - **Sistema de Temas**: Implementación de un administrador visual de estilos. 
    - `Glass Nature`: Estética glassmorphic con gradientes dinámicos.
    - `Bento Earth`: Estética de cajas sólidas, colores tierra y grandes radios de borde.
- **Arquitectura de Estado**: Integración de `Zustand` para manejar el estado de la UI y persistencia de temas.
- **Dependencias nuevas**: `@mlc-ai/web-llm` (IA Local), `zustand` (Estado), `next-themes` (Modo oscuro/claro extendido).

## Microservicio (Heatmap)
- **Ruta**: `/microservice/`
- **Levantar**: `cd microservice && source venv/bin/activate && python main.py`
- **Dependencias**: OpenCV (contrib), FastAPI, NumPy.
