import { CircleDollarSign, Boxes, TriangleAlert, TrendingDown, type LucideIcon } from 'lucide-react';
import { clp } from '../../lib/format';
import type { Resumen } from './metrics';

type Tono = 'azul' | 'ok' | 'ambar' | 'rojo';

const CAJA: Record<Tono, string> = {
  azul: 'bg-azul-pale text-azul',
  ok: 'bg-ok-pale text-ok',
  ambar: 'bg-ambar-pale text-ambar',
  rojo: 'bg-rojo-pale text-rojo',
};

function Kpi({
  icon: Ico, tono, etiqueta, valor, sub,
}: {
  icon: LucideIcon;
  tono: Tono;
  etiqueta: string;
  valor: string;
  sub: string;
}) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${CAJA[tono]}`}>
        <Ico className="size-[22px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="text-[0.8rem] font-semibold text-gris">{etiqueta}</div>
        <div className="num mt-0.5 text-[1.7rem] font-extrabold leading-none tracking-[-0.03em] text-texto">
          {valor}
        </div>
        <div className="mt-1 text-[0.8rem] text-gris-2">{sub}</div>
      </div>
    </div>
  );
}

/** Fila de indicadores clave del inventario. */
export function KpiTiles({ r, ambito }: { r: Resumen; ambito: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 min-[1080px]:grid-cols-4">
      <Kpi
        icon={CircleDollarSign}
        tono="azul"
        etiqueta="Valor de inventario"
        valor={clp(r.valor)}
        sub={`${ambito} · precio referencial`}
      />
      <Kpi
        icon={Boxes}
        tono="ok"
        etiqueta="Unidades en stock"
        valor={r.unidades.toLocaleString('es-CL')}
        sub={`${r.skus} productos activos`}
      />
      <Kpi
        icon={TrendingDown}
        tono="ambar"
        etiqueta="Stock bajo"
        valor={String(r.bajos)}
        sub="productos con 8 unidades o menos"
      />
      <Kpi
        icon={TriangleAlert}
        tono="rojo"
        etiqueta="Quiebres de stock"
        valor={String(r.quiebres)}
        sub="productos sin unidades"
      />
    </div>
  );
}
