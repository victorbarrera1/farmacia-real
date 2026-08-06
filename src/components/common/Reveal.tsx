'use client';

import { useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/src/lib/gsap';

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Retraso en segundos (útil para escalonar grillas). */
  delay?: number;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  style?: CSSProperties;
};

/**
 * Aparición suave al hacer scroll (fade + slide).
 * Respeta `prefers-reduced-motion`: con movimiento reducido no se anima y el
 * contenido queda visible. Como el estado oculto lo pone GSAP en el cliente,
 * sin JS la página también se ve completa.
 */
export function Reveal({ as: Tag = 'div', children, className, delay = 0, y = 26, style }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mq = gsap.matchMedia();
    mq.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(el, { opacity: 0, y }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
    return () => mq.revert();
  }, { scope: ref });

  return (
    <Tag ref={ref as never} className={className} style={style}>
      {children}
    </Tag>
  );
}
