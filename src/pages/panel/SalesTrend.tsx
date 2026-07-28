import { useMemo } from 'react';
import { AreaChart } from './charts/AreaChart';
import { serieVentas, totalSerie, conversion } from './analytics';

/** Tendencia de ventas de los últimos 14 días (demo). */
export function SalesTrend() {
  const serie = useMemo(() => serieVentas(14), []);
  const total = totalSerie(serie);
  const conv = conversion();

  return (
    <section className="card p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[1rem] font-extrabold">Tendencia de ventas</h3>
          <p className="mt-0.5 text-[0.82rem] text-gris">Unidades vendidas · últimos 14 días</p>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="num text-[1.4rem] font-extrabold leading-none tracking-[-0.03em] text-texto">
              {total.toLocaleString('es-CL')}
            </div>
            <div className="mt-1 text-[0.76rem] text-gris-2">unidades</div>
          </div>
          <div>
            <div className="num text-[1.4rem] font-extrabold leading-none tracking-[-0.03em] text-ok">{conv}%</div>
            <div className="mt-1 text-[0.76rem] text-gris-2">conversión</div>
          </div>
        </div>
      </header>

      <AreaChart serie={serie} formato={(n) => `${n.toLocaleString('es-CL')} u.`} />
    </section>
  );
}
