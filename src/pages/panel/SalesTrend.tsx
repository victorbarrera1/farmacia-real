import { useMemo } from 'react';
import { AreaChart } from './charts/AreaChart';
import { serieUnidades, totalSerie } from './analytics';
import { usePedidosRegistrados } from '../../hooks/useDatos';

/**
 * Unidades pedidas por día, calculadas sobre el historial local real.
 * Sin pedidos registrados no dibuja una serie falsa: avisa "sin datos".
 */
export function SalesTrend() {
  const pedidos = usePedidosRegistrados();
  const serie = useMemo(() => serieUnidades(pedidos, 14), [pedidos]);
  const total = totalSerie(serie);

  return (
    <section className="card p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[1rem] font-extrabold">Unidades pedidas por día</h3>
          <p className="mt-0.5 text-[0.82rem] text-gris">
            Últimos 14 días · pedidos armados y enviados desde este navegador
          </p>
        </div>
        <div>
          <div className="num text-[1.4rem] font-extrabold leading-none tracking-[-0.03em] text-texto">
            {total.toLocaleString('es-CL')}
          </div>
          <div className="mt-1 text-[0.76rem] text-gris-2">unidades</div>
        </div>
      </header>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-linea bg-fondo px-4 py-10 text-center text-[0.9rem] text-gris">
          <b className="block font-extrabold text-texto">Sin datos aún</b>
          Cuando se envíen pedidos por WhatsApp desde la tienda, la tendencia aparecerá acá.
          {/* TODO(api): alimentar con ventas reales del backend. */}
        </p>
      ) : (
        <AreaChart serie={serie} formato={(n) => `${n.toLocaleString('es-CL')} u.`} />
      )}
    </section>
  );
}
