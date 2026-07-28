import { useEffect, type RefObject } from 'react';

/**
 * Mide el alto real del elemento (la cabecera cambia de alto entre móvil y
 * escritorio) y lo publica en la variable CSS `--top-nav`, para que la barra
 * de categorías se pegue justo debajo sin quedar escondida.
 */
export function useStickyOffset(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const medir = () =>
      document.documentElement.style.setProperty(
        '--top-nav',
        Math.round(el.getBoundingClientRect().height) + 'px',
      );

    medir();
    window.addEventListener('resize', medir);
    const ro = 'ResizeObserver' in window ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener('resize', medir);
      ro?.disconnect();
    };
  }, [ref]);
}
