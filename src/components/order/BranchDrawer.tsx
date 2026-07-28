import { Drawer } from './Drawer';
import { BranchCard } from '../branches/BranchCard';
import { SUCURSALES } from '../../data/sucursales';
import { useStore } from '../../store/StoreContext';
import { usePrefiereMenosMov } from '../../hooks/useMediaQuery';

/** Cajón selector de sucursal. */
export function BranchDrawer() {
  const { estado, dispatch } = useStore();
  const menosMov = usePrefiereMenosMov();

  function elegir(id: string) {
    dispatch({ type: 'sucursal', id });
    dispatch({ type: 'cerrarCajones' });
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
        {SUCURSALES.map((s) => (
          <BranchCard key={s.id} suc={s} elegida={s.id === estado.sucursal} onSelect={() => elegir(s.id)} />
        ))}
      </div>
    </Drawer>
  );
}
