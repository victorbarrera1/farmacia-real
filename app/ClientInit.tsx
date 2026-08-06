'use client';

import { useEffect } from 'react';
import { hidratar } from '@/src/data/repo';

/** Llama `hidratar()` una vez al cargar la app (equivalente a src/main.tsx). */
export function ClientInit() {
  useEffect(() => {
    hidratar().catch(() => undefined);
  }, []);
  return null;
}
