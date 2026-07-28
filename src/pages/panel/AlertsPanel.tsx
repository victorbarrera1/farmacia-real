import type { Producto } from '../../types';

/** Lista priorizada de productos que requieren reposición (bajo o quiebre). */
export function AlertsPanel({ items, ambito }: { items: { p: Producto; u: number }[]; ambito: string }) {
  return (
    <section className="card flex flex-col p-5">
      <header className="mb-3">
        <h3 className="text-[1rem] font-extrabold">Alertas de reposición</h3>
        <p className="mt-0.5 text-[0.82rem] text-gris">{items.length} productos por reponer · {ambito}</p>
      </header>

      {items.length === 0 ? (
        <p className="py-6 text-center text-[0.9rem] text-gris">Sin alertas: todo el catálogo tiene stock suficiente.</p>
      ) : (
        <ul className="-mx-1 max-h-[320px] flex-1 overflow-y-auto">
          {items.map(({ p, u }) => (
            <li key={p.id} className="flex items-center gap-3 border-b border-linea-2 px-1 py-2.5 last:border-b-0">
              <span className={`size-2 shrink-0 rounded-full ${u === 0 ? 'bg-rojo' : 'bg-ambar'}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.88rem] font-bold text-texto">{p.n}</div>
                <div className="truncate text-[0.76rem] text-gris-2">{p.lab}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[0.74rem] font-bold ${
                  u === 0 ? 'bg-rojo-pale text-rojo' : 'bg-ambar-pale text-ambar'
                }`}
              >
                {u === 0 ? 'Sin stock' : `Quedan ${u}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
