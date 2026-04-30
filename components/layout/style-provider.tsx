'use client';

import { useUIStore, type VisualStyle } from '@/lib/store';
import { useEffect, useState } from 'react';

const BG_CLASSES: Record<VisualStyle, string | null> = {
  nature: 'bg-nature',
  earth: null,
  aurora: null,
  cyber: null,
  ocean: null,
};

const ALL_THEMES: VisualStyle[] = ['nature', 'earth', 'aurora', 'cyber', 'ocean'];

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const { visualStyle } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const body = document.body;

    // Remove all theme classes
    ALL_THEMES.forEach((t) => body.classList.remove(`theme-${t}`));
    // Remove all bg classes
    body.classList.remove('bg-nature');

    // Add current theme
    body.classList.add(`theme-${visualStyle}`);

    // Add bg class if needed (nature uses a utility class for its gradient)
    const bgClass = BG_CLASSES[visualStyle];
    if (bgClass) body.classList.add(bgClass);
  }, [visualStyle, mounted]);

  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}
