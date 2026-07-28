import { useEffect, useState } from 'react';

/** Escucha una media query y devuelve si coincide. SSR-safe. */
export function useMediaQuery(query: string): boolean {
  const [coincide, setCoincide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setCoincide(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return coincide;
}

/** `true` si el usuario pidió menos movimiento. */
export const usePrefiereMenosMov = () => useMediaQuery('(prefers-reduced-motion: reduce)');
