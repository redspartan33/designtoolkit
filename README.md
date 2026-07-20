# DesignKit

DesignKit es una plataforma web personal para diseñadores que reúne un conjunto de herramientas modulares y rápidas para el día a día. Todo corre localmente en tu máquina, asegurando privacidad y velocidad.

## Stack Técnico

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- `@base-ui/react` (primitivas de UI; los componentes se generaron con shadcn CLI)
- Zustand (estado global) + i18n casero (es/en)
- pnpm
- Biome (Lint & Format)
- Vitest (tests de lógica pura)

## Cómo correrlo localmente

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   pnpm install
   ```
3. Levanta el entorno de desarrollo:
   ```bash
   pnpm dev
   ```
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Tests

Los módulos de lógica pura (`lib/`) se testean con Vitest:

```bash
pnpm test
```

## Microservicio (Heatmap Analyzer)

Algunas herramientas usan red: **Heatmap Analyzer** depende de un microservicio Python (FastAPI + OpenCV) que corre aparte, y **Buscador de Iconos / Tipografías** consultan APIs externas. El resto de herramientas son 100% locales.

Para levantar el microservicio del heatmap:

```bash
cd microservice
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload           # queda en http://127.0.0.1:8000
```

El `venv/` es local y está en `.gitignore` (no se versiona).

## Cómo agregar una herramienta nueva

DesignKit está diseñado para ser extremadamente modular. Para agregar una herramienta, solo debes seguir estos 2 pasos:

### 1. Crear la página de la herramienta

Crea una carpeta y un archivo `page.tsx` dentro de `app/tools/`. Por ejemplo, para una herramienta llamada "Magic Tool":

```tsx
// app/tools/magic-tool/page.tsx
import { ToolPageShell } from "@/components/tools/tool-page-shell";

export default function MagicToolPage() {
  return (
    <ToolPageShell toolId="magic-tool">
      <div>
        <p>Aquí va el contenido de tu herramienta mágica.</p>
      </div>
    </ToolPageShell>
  );
}
```

### 2. Registrar la herramienta

Abre el archivo `lib/tools-registry.ts` y agrega un nuevo objeto al array `toolsRegistry`:

```ts
import { Wand2 } from 'lucide-react';

export const toolsRegistry: Tool[] = [
  // ...otras herramientas
  {
    id: 'magic-tool',
    name: 'Magic Tool',
    description: 'Hace cosas mágicas increíbles.',
    category: 'Layout',
    icon: Wand2,
    route: '/tools/magic-tool',
    status: 'beta', // 'stable' | 'beta' | 'coming-soon'
    privacy: 'local',
    tags: ['magic', 'awesome'],
  }
];
```

¡Y listo! El dashboard y la barra lateral se actualizarán automáticamente.
