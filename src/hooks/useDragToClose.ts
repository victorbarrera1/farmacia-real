import { useEffect, type RefObject } from 'react';

/* Arrastrar para cerrar (solo móvil).
   Se combinan desplazamiento y velocidad: nunca se decide por velocidad sola. */
const UMBRAL_PX = 110;
const UMBRAL_VEL = 0.55; // px/ms

interface Opciones {
  enabled: boolean;
  onClose: () => void;
  /** Selector del área scrolleable interna (para no robar el scroll). */
  cuerpoSelector?: string;
}

/**
 * Habilita gesto de arrastre-para-cerrar sobre el elemento referenciado.
 * Manipula el transform directamente (fuera del render de React) para que
 * el gesto se sienta fluido.
 */
export function useDragToClose(
  ref: RefObject<HTMLElement | null>,
  { enabled, onClose, cuerpoSelector = '.cajon-cuerpo' }: Opciones,
): void {
  useEffect(() => {
    const cajon = ref.current;
    if (!cajon || !enabled) return;

    let activo = false;
    let y0 = 0, dy = 0, vel = 0, yPrev = 0, tPrev = 0;

    const puedeArrastrar = (e: PointerEvent): boolean => {
      if (window.innerWidth >= 720) return false;
      const cuerpo = cajon.querySelector(cuerpoSelector);
      const target = e.target as Node;
      return !cuerpo || !cuerpo.contains(target) || cuerpo.scrollTop <= 0;
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || !puedeArrastrar(e)) return;
      activo = true;
      y0 = yPrev = e.clientY;
      tPrev = performance.now();
      dy = vel = 0;
      cajon.dataset.arrastrando = 'si';
    };

    const onMove = (e: PointerEvent) => {
      if (!activo) return;
      dy = Math.max(0, e.clientY - y0);
      const t = performance.now();
      const dt = t - tPrev;
      if (dt > 0) vel = (e.clientY - yPrev) / dt;
      yPrev = e.clientY;
      tPrev = t;
      cajon.style.transform = `translateY(${dy}px)`;
    };

    const soltar = () => {
      if (!activo) return;
      activo = false;
      cajon.dataset.arrastrando = 'no';
      cajon.style.transform = '';
      if (dy > UMBRAL_PX || vel > UMBRAL_VEL) onClose();
    };

    cajon.addEventListener('pointerdown', onDown);
    cajon.addEventListener('pointermove', onMove);
    cajon.addEventListener('pointerup', soltar);
    cajon.addEventListener('pointercancel', soltar);
    return () => {
      cajon.removeEventListener('pointerdown', onDown);
      cajon.removeEventListener('pointermove', onMove);
      cajon.removeEventListener('pointerup', soltar);
      cajon.removeEventListener('pointercancel', soltar);
    };
  }, [ref, enabled, onClose, cuerpoSelector]);
}
