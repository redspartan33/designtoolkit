import { LucideIcon } from 'lucide-react';

export type ToolCategory = 'Imagen' | 'Color' | 'Código' | 'Análisis' | 'Layout' | 'Escritura';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  route: string;
  status: 'stable' | 'beta' | 'coming-soon';
  privacy: 'local' | 'server';
  tags: string[];
}
