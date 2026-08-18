'use client';

import { LayoutGrid, SlidersHorizontal, X } from 'lucide-react';
import type { Orden, Producto } from '../../types';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { ET_RANGOS, hayFiltros } from '../../store/state';
import { stockDe } from '../../lib/stock';

/** Controles de resultados: categorías/filtros móviles, conteo y orden. */
export function FiltersRow({ lista }: { lista: Producto[] }) {
  const { estado, dispatch } = useStore();
  const suc = useSucursalActual();
  const conStock = lista.filter((p) => stockDe(p, suc.id) > 0).length;
  const activos: { et: string; quitar: () => void }[] = [
    ...(estado.soloStock ? [{ et: 'Disponible hoy', quitar: () => dispatch({ type: 'soloStock' as const, on: false }) }] : []),
    ...(estado.soloBio ? [{ et: 'Bioequivalente', quitar: () => dispatch({ type: 'soloBio' as const, on: false }) }] : []),
    ...(estado.sinReceta ? [{ et: 'Sin receta', quitar: () => dispatch({ type: 'sinReceta' as const, on: false }) }] : []),
    ...(estado.precio !== 'todos' ? [{ et: ET_RANGOS[estado.precio], quitar: () => dispatch({ type: 'precio' as const, rango: 'todos' as const }) }] : []),
    ...estado.labs.map((lab) => ({ et: lab, quitar: () => dispatch({ type: 'lab' as const, lab }) })),
  ];

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 text-[0.91rem] text-gris">
        <button type="button" aria-haspopup="dialog" onClick={() => dispatch({ type: 'abrirCajon', cajon: 'menu' })} className="flex min-h-11 items-center gap-2 rounded-full border-2 border-azul bg-white px-3.5 font-bold text-azul hover:bg-azul-pale min-[1000px]:hidden">
          <LayoutGrid className="size-[17px]" aria-hidden="true" /> Categorías
        </button>
        <button type="button" aria-haspopup="dialog" onClick={() => dispatch({ type: 'abrirCajon', cajon: 'filtros' })} className="flex min-h-11 items-center gap-2 rounded-full border-2 border-azul bg-white px-3.5 font-bold text-azul hover:bg-azul-pale min-[1000px]:hidden">
          <SlidersHorizontal className="size-[17px]" aria-hidden="true" /> Filtrar
          {activos.length > 0 && <span className="num grid size-5 place-items-center rounded-full bg-azul text-[0.7rem] text-white">{activos.length}</span>}
        </button>

        <span className="order-last w-full min-[620px]:order-none min-[620px]:w-auto">
          <b className="num font-extrabold text-texto">{lista.length}</b> producto{lista.length === 1 ? '' : 's'} · <b className="num font-extrabold text-texto">{conStock}</b> para retirar hoy
        </span>

        <span className="ml-auto inline-flex items-center gap-2">
          <label htmlFor="orden" className="hidden min-[600px]:inline">Ordenar</label>
          <select id="orden" className="select-orden" value={estado.orden} onChange={(e) => dispatch({ type: 'orden', orden: e.target.value as Orden })}>
            <option value="destacados">Recomendados</option><option value="precio-asc">Menor precio</option><option value="precio-desc">Mayor precio</option><option value="nombre">Nombre A-Z</option>
          </select>
        </span>
      </div>

      {activos.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activos.map((f) => <button key={f.et} type="button" onClick={f.quitar} aria-label={`Quitar filtro ${f.et}`} className="flex min-h-9 items-center gap-1.5 rounded-full bg-azul-pale px-3 text-[0.83rem] font-bold text-azul-osc hover:bg-azul hover:text-white">{f.et}<X className="size-3.5" aria-hidden="true" /></button>)}
          {hayFiltros(estado) && <button type="button" onClick={() => dispatch({ type: 'limpiarFiltros' })} className="min-h-9 px-2 text-[0.83rem] font-bold text-rojo hover:underline">Limpiar todo</button>}
        </div>
      )}
    </div>
  );
}
