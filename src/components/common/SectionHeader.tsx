import type { ReactNode } from 'react';

/** Encabezado de sección consistente: título con acento de marca + bajada. */
export function SectionHeader({ titulo, children }: { titulo: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="titulo-seccion">{titulo}</h2>
      {children && <p className="mt-1.5 max-w-[60ch] pl-[14px] text-[0.95rem] text-gris">{children}</p>}
    </div>
  );
}
