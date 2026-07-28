import { useMemo, useState } from 'react';
import { Search, Minus, Plus } from 'lucide-react';
import { PRODUCTOS } from '../../data/productos';
import { CATEGORIAS } from '../../data/categorias';
import { SUCURSALES } from '../../data/sucursales';
import { sinTildes } from '../../lib/format';
import { nivelDe } from '../../lib/stock';
import type { StockMap } from './metrics';

const TINTE_CELDA = {
  alto: '',
  bajo: 'bg-ambar-pale',
  cero: 'bg-rojo-pale',
} as const;

const TEXTO_CELDA = {
  alto: 'text-texto',
  bajo: 'text-ambar',
  cero: 'text-rojo',
} as const;

interface Props {
  stock: StockMap;
  fijar: (id: string, idx: number, unidades: number) => void;
  ajustar: (id: string, idx: number, delta: number) => void;
}

/** Tabla editable de control de stock por sucursal (simulada). */
export function StockTable({ stock, fijar, ajustar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');

  const filas = useMemo(() => {
    const q = sinTildes(busqueda.trim());
    return PRODUCTOS.filter((p) => {
      if (categoria !== 'todos' && p.cat !== categoria) return false;
      if (!q) return true;
      return sinTildes(`${p.n} ${p.lab} ${p.act}`).includes(q);
    });
  }, [busqueda, categoria]);

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-linea p-5">
        <div>
          <h3 className="text-[1rem] font-extrabold">Control de stock</h3>
          <p className="mt-0.5 text-[0.82rem] text-gris">Ajusta las unidades por sucursal · {filas.length} productos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-[18px] text-gris-2" aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto…"
              aria-label="Buscar producto"
              className="h-11 rounded-lg border border-linea bg-white pl-10 pr-3 text-[0.9rem] focus:border-azul focus:outline-none"
            />
          </div>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
            className="select-orden"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>{c.et}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-linea bg-fondo">
              <th className="sticky left-0 z-10 bg-fondo px-5 py-3 text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-gris-2">
                Producto
              </th>
              {SUCURSALES.map((s) => (
                <th key={s.id} className="px-3 py-3 text-center text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-gris-2">
                  {s.corto}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-gris-2">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((p) => {
              const fila = stock[p.id] ?? p.st;
              const total = fila.reduce((a, b) => a + b, 0);
              return (
                <tr key={p.id} className="border-b border-linea-2 last:border-b-0 hover:bg-fondo/60">
                  <td className="sticky left-0 z-10 bg-white px-5 py-3">
                    <div className="text-[0.9rem] font-bold leading-tight text-texto">{p.n}</div>
                    <div className="mt-0.5 text-[0.78rem] text-gris-2">{p.lab} · {p.pres}</div>
                  </td>
                  {SUCURSALES.map((s, idx) => {
                    const u = fila[idx] ?? 0;
                    const nivel = nivelDe(u);
                    return (
                      <td key={s.id} className={`px-3 py-2 ${TINTE_CELDA[nivel]}`}>
                        <div className="mx-auto flex w-fit items-center overflow-hidden rounded-lg border border-linea bg-white">
                          <button
                            type="button"
                            aria-label={`Restar una unidad de ${p.n} en ${s.corto}`}
                            onClick={() => ajustar(p.id, idx, -1)}
                            className="grid size-8 place-items-center text-gris hover:bg-fondo disabled:opacity-40"
                            disabled={u === 0}
                          >
                            <Minus className="size-3.5" aria-hidden="true" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={u}
                            onChange={(e) => fijar(p.id, idx, Number(e.target.value))}
                            aria-label={`Unidades de ${p.n} en ${s.corto}`}
                            className={`num w-11 border-x border-linea py-1.5 text-center text-[0.9rem] font-bold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${TEXTO_CELDA[nivel]}`}
                          />
                          <button
                            type="button"
                            aria-label={`Sumar una unidad de ${p.n} en ${s.corto}`}
                            onClick={() => ajustar(p.id, idx, 1)}
                            className="grid size-8 place-items-center text-gris hover:bg-fondo"
                          >
                            <Plus className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                  <td className="num px-4 py-3 text-center text-[0.95rem] font-extrabold tabular-nums text-texto">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
