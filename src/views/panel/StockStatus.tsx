import { CheckCircle2, AlertCircle, XCircle, type LucideIcon } from 'lucide-react';
import type { Resumen } from './metrics';

interface Segmento {
  clave: string;
  etiqueta: string;
  valor: number;
  color: string;
  texto: string;
  icon: LucideIcon;
}

/** Distribución del estado del stock (disponible / bajo / quiebre). */
export function StockStatus({ r, ambito }: { r: Resumen; ambito: string }) {
  const segmentos: Segmento[] = [
    { clave: 'ok', etiqueta: 'Disponible', valor: r.disponibles, color: 'bg-ok', texto: 'text-ok', icon: CheckCircle2 },
    { clave: 'bajo', etiqueta: 'Stock bajo', valor: r.bajos, color: 'bg-ambar', texto: 'text-ambar', icon: AlertCircle },
    { clave: 'cero', etiqueta: 'Quiebre', valor: r.quiebres, color: 'bg-rojo', texto: 'text-rojo', icon: XCircle },
  ];
  const total = Math.max(1, r.skus);

  return (
    <section className="card p-5">
      <header className="mb-4">
        <h3 className="text-[1rem] font-extrabold">Estado del stock</h3>
        <p className="mt-0.5 text-[0.82rem] text-gris">{r.skus} productos · {ambito}</p>
      </header>

      {/* Barra segmentada con separación de 2px entre tramos */}
      <div className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full">
        {segmentos.map((s) =>
          s.valor > 0 ? (
            <div
              key={s.clave}
              className={s.color}
              style={{ width: `${(s.valor / total) * 100}%` }}
              title={`${s.etiqueta}: ${s.valor}`}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {segmentos.map((s) => {
          const Ico = s.icon;
          const pct = Math.round((s.valor / total) * 100);
          return (
            <li key={s.clave} className="flex items-center gap-2.5 text-[0.9rem]">
              <Ico className={`size-[18px] shrink-0 ${s.texto}`} aria-hidden="true" />
              <span className="font-semibold text-texto">{s.etiqueta}</span>
              <span className="num ml-auto font-extrabold text-texto">{s.valor}</span>
              <span className="num w-10 shrink-0 text-right text-gris-2">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
