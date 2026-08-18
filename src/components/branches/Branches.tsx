import { BranchCard } from './BranchCard';
import { SectionHeader } from '../common/SectionHeader';
import { useStore } from '../../store/StoreContext';
import { useSucursales } from '../../hooks/useDatos';

/** Sucursales compactas: único bloque informativo después del catálogo. */
export function Branches() {
  const { estado, dispatch, anunciar } = useStore();
  const sucursales = useSucursales();

  return (
    <section id="sucursales" className="border-y border-linea bg-white py-7 min-[760px]:py-9">
      <div className="env">
        <SectionHeader titulo="Nuestras sucursales">Elige un local para ver su stock y sus precios.</SectionHeader>
        <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 min-[1040px]:grid-cols-4">
          {sucursales.map((s) => (
            <BranchCard
              key={s.id}
              suc={s}
              elegida={s.id === estado.sucursal}
              onSelect={() => {
                dispatch({ type: 'sucursal', id: s.id });
                anunciar(`Viendo el stock de ${s.nombre}`);
                document.getElementById('catalogo')?.scrollIntoView({ block: 'start' });
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
