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

## Fase Actual: Fase 5 - Ampliación de Herramientas
- **Herramientas Implementadas**:
  - Generador QR, Extractor de Paleta, Contraste, Compresor de Imágenes (Cliente).
  - **Removedor de Fondos**: IA en cliente vía `@imgly/background-removal`.
  - **Heatmap Analyzer**: Análisis de atención basado en principios UX. Requiere microservicio FastAPI en puerto 8000.
  - **Upscaler** (`image-upscaler`): Interpolación bilineal + sharpening via Canvas API. 100% cliente.
  - **Escalas de Color** (`color-scale-generator`): Generación HSL de escalas (Tailwind/Pastel/Vívido/Neutral), exporta CSS vars.
  - **Optimizador SVG** (`svg-optimizer`): Usa `svgo/browser` con plugins configurables individualmente.
  - **Gradientes** (`gradient-generator`): Lineal/Radial/Cónico, editor de paradas, presets, exporta CSS y PNG.
  - **Convertidor de Formatos** (`format-converter`): Canvas API para PNG/JPG/WEBP/AVIF con control de calidad.
- **Componentes Compartidos**:
  - `ImageDropZone`: Estandarizado para carga, arrastre y pegado de imágenes.
- **Dependencias nuevas**: `svgo@4` (usado via `svgo/browser` con import dinámico).

## Microservicio (Heatmap)
- **Ruta**: `/microservice/`
- **Levantar**: `cd microservice && source venv/bin/activate && python main.py`
- **Dependencias**: OpenCV (contrib), FastAPI, NumPy.

