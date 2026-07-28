import type { ReactNode } from 'react';

/** Encabezado de sección consistente: título + bajada opcional. */
export function SectionHeader({ titulo, children }: { titulo: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2>{titulo}</h2>
        {children && <p className="mt-[5px] max-w-[56ch] text-[0.95rem] text-gris">{children}</p>}
      </div>
    </div>
  );
}
