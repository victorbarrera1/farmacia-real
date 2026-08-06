import type { FilaCategoria } from './metrics';

/** Bar chart horizontal: inventario (unidades) por categoría. Una sola tonalidad. */
export function CategoryBars({ filas, ambito }: { filas: FilaCategoria[]; ambito: string }) {
  const max = Math.max(1, ...filas.map((f) => f.unidades));

  return (
    <section className="card p-5">
      <header className="mb-4">
        <h3 className="text-[1rem] font-extrabold">Inventario por categoría</h3>
        <p className="mt-0.5 text-[0.82rem] text-gris">Unidades en stock · {ambito}</p>
      </header>

      <div className="flex flex-col gap-3">
        {filas.map((f) => {
          const pct = (f.unidades / max) * 100;
          return (
            <div key={f.id} className="grid grid-cols-[minmax(96px,140px)_1fr] items-center gap-3">
              <span className="truncate text-[0.85rem] font-semibold text-texto">{f.et}</span>
              <div className="flex items-center gap-2.5">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-linea-2">
                  <div
                    className="h-full rounded-full bg-azul transition-[width] duration-500"
                    style={{ width: `${Math.max(pct, f.unidades > 0 ? 4 : 0)}%` }}
                    title={`${f.et}: ${f.unidades} unidades`}
                  />
                </div>
                <span className="num w-12 shrink-0 text-right text-[0.85rem] font-bold tabular-nums text-texto">
                  {f.unidades}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
