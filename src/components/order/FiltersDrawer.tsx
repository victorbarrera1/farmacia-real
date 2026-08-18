'use client';

import { Drawer } from './Drawer';
import { CatalogFilters } from '../catalog/CatalogFilters';
import { useStore } from '../../store/StoreContext';
import { useCatalogo } from '../../hooks/useCatalogo';
import { hayFiltros } from '../../store/state';

/** Cajón de filtros del catálogo (móvil y tablet). */
export function FiltersDrawer() {
  const { estado, dispatch } = useStore();
  const lista = useCatalogo();

  const footer = (
    <div className="flex gap-2.5">
      {hayFiltros(estado) && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'limpiarFiltros' })}
          className="btn btn-borde flex-1"
        >
          Limpiar
        </button>
      )}
      <button
        type="button"
        onClick={() => dispatch({ type: 'cerrarCajones' })}
        className="btn btn-azul flex-[1.4]"
      >
        Ver {lista.length} producto{lista.length === 1 ? '' : 's'}
      </button>
    </div>
  );

  return (
    <Drawer
      abierto={estado.cajon === 'filtros'}
      onClose={() => dispatch({ type: 'cerrarCajones' })}
      titulo="Filtrar catálogo"
      subtitulo="Se aplica sobre el stock de tu local"
      labelId="tFiltros"
      cerrarLabel="Cerrar filtros"
      footer={footer}
    >
      <CatalogFilters enCajon mostrarCategorias={false} />
    </Drawer>
  );
}
