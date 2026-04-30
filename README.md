# DesignKit

DesignKit es una plataforma web personal para diseñadores que reúne un conjunto de herramientas modulares y rápidas para el día a día. Todo corre localmente en tu máquina, asegurando privacidad y velocidad.

## Stack Técnico

- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/ui
- pnpm
- Biome (Lint & Format)

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
