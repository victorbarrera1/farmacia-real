import { Drawer } from './Drawer';
import { BranchCard } from '../branches/BranchCard';
import { useStore } from '../../store/StoreContext';
import { useSucursales } from '../../hooks/useDatos';
import { usePrefiereMenosMov } from '../../hooks/useMediaQuery';

/** Cajón selector de sucursal. */
export function BranchDrawer() {
  const { estado, dispatch, anunciar } = useStore();
  const sucursales = useSucursales();
  const menosMov = usePrefiereMenosMov();

  function elegir(id: string, nombre: string) {
    dispatch({ type: 'sucursal', id });
    dispatch({ type: 'cerrarCajones' });
    anunciar(`Retiras en ${nombre}. Catálogo y stock actualizados.`);
    document
      .getElementById('catalogo')
      ?.scrollIntoView({ behavior: menosMov ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <Drawer
      abierto={estado.cajon === 'suc'}
      onClose={() => dispatch({ type: 'cerrarCajones' })}
      titulo="Elige tu sucursal"
      subtitulo="El stock y el WhatsApp cambian según el local"
      labelId="tSuc"
      cerrarLabel="Cerrar selector"
    >
      <div className="grid grid-cols-1 gap-3 py-2">
        {sucursales.map((s) => (
          <BranchCard
            key={s.id}
            suc={s}
            elegida={s.id === estado.sucursal}
            onSelect={() => elegir(s.id, s.nombre)}
          />
        ))}
      </div>
    </Drawer>
  );
}
