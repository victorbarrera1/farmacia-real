import type { Producto } from '../../types';

/** Sello flotante sobre la imagen del producto (bioequivalente, receta, frío). */
function Sello({ tono, children }: { tono: 'be' | 'rec' | 'frio'; children: string }) {
  const estilos = {
    be: 'bg-ambar-pale text-ambar border-ambar-borde',
    rec: 'bg-rojo-pale text-rojo border-rojo-borde',
    frio: 'bg-frio-pale text-frio border-frio-borde',
  }[tono];

  return (
    <span
      className={`rounded-sm border px-[7px] py-[3px] text-[0.64rem] font-extrabold leading-[1.3] tracking-[0.03em] ${estilos}`}
    >
      {children}
    </span>
  );
}

/** Pila de sellos según los flags del producto. */
export function Sellos({ p }: { p: Producto }) {
  return (
    <span className="absolute left-[7px] top-[7px] flex flex-col items-start gap-1">
      {p.be && <Sello tono="be">Bioequivalente</Sello>}
      {p.rec && <Sello tono="rec">Receta</Sello>}
      {p.frio && <Sello tono="frio">Frío</Sello>}
    </span>
  );
}
