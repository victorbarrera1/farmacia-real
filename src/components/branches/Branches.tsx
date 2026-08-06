import { BranchCard } from './BranchCard';
import { SectionHeader } from '../common/SectionHeader';
import { Reveal } from '../common/Reveal';
import { useStore } from '../../store/StoreContext';
import { useSucursales } from '../../hooks/useDatos';

/** Sección "Nuestras sucursales": grilla de locales. */
export function Branches() {
  const { estado, dispatch, anunciar } = useStore();
  const sucursales = useSucursales();

  return (
    <section id="sucursales" className="border-y border-linea bg-white py-[clamp(30px,5vw,52px)]">
      <div className="env">
        <Reveal>
          <SectionHeader titulo="Nuestras sucursales">Toca una para ver su catálogo y su stock.</SectionHeader>
        </Reveal>
        <div className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-2 min-[1040px]:grid-cols-4">
          {sucursales.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.08} className="h-full">
              <BranchCard
                suc={s}
                elegida={s.id === estado.sucursal}
                onSelect={() => {
                  dispatch({ type: 'sucursal', id: s.id });
                  anunciar(`Viendo el stock de ${s.nombre}`);
                }}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
