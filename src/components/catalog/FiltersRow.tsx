import type { Orden, Producto } from '../../types';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { stockDe } from '../../lib/stock';

/** Fila de filtros del catálogo: resumen, solo-stock y orden. */
export function FiltersRow({ lista }: { lista: Producto[] }) {
  const { estado, dispatch } = useStore();
  const suc = useSucursalActual();
  const conStock = lista.filter((p) => stockDe(p, suc.id) > 0).length;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3.5 text-[0.94rem] text-gris">
      <span>
        <b className="font-extrabold text-texto">{lista.length}</b> producto{lista.length === 1 ? '' : 's'} ·{' '}
        <b className="font-extrabold text-texto">{conStock}</b> disponible{conStock === 1 ? '' : 's'} en {suc.nombre}
      </span>

      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 font-semibold">
        <input
          type="checkbox"
          role="switch"
          className="switch"
          checked={estado.soloStock}
          onChange={(e) => dispatch({ type: 'soloStock', on: e.target.checked })}
        />
        Solo productos disponibles
      </label>

      <span className="inline-flex items-center gap-[9px]">
        <label htmlFor="orden">Ordenar por</label>
        <select
          id="orden"
          className="select-orden"
          value={estado.orden}
          onChange={(e) => dispatch({ type: 'orden', orden: e.target.value as Orden })}
        >
          <option value="destacados">Recomendados</option>
          <option value="precio-asc">Menor precio</option>
          <option value="precio-desc">Mayor precio</option>
          <option value="nombre">Nombre A-Z</option>
        </select>
      </span>
    </div>
  );
}
