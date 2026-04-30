'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Image,
  Palette,
  Code2,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store';

const NAV_ITEMS = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Imagen', href: '/tools/image-compressor', icon: Image },
  { label: 'Color', href: '/tools/palette-extractor', icon: Palette },
  { label: 'Código', href: '/tools/qr-generator', icon: Code2 },
  { label: 'Escritura', href: '/tools/lorem-ipsum', icon: PenLine },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { setCommandPaletteOpen } = useUIStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
      <div className="flex items-stretch h-16 px-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
            </Link>
          );
        })}

        {/* Search button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground"
        >
          <Search className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wide">Buscar</span>
        </button>
      </div>
    </nav>
  );
}
