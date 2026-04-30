'use client';

import { useUIStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const { visualStyle } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const body = document.body;
    // Remove old classes
    body.classList.remove('theme-nature', 'theme-earth');
    // Add new class
    body.classList.add(`theme-${visualStyle}`);
    
    // Toggle bg-nature based on theme
    if (visualStyle === 'nature') {
      body.classList.add('bg-nature');
    } else {
      body.classList.remove('bg-nature');
    }
  }, [visualStyle, mounted]);

  // Prevent hydration mismatch
  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}
