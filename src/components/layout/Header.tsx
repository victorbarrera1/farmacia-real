import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { Logo } from '../common/Logo';
import { SearchBox } from './SearchBox';
import { BranchPicker } from './BranchPicker';
import { useStore } from '../../store/StoreContext';
import { useStickyOffset } from '../../hooks/useStickyOffset';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { usePrefiereMenosMov } from '../../hooks/useMediaQuery';
import { cantidadPedido, totalPedido } from '../../lib/pedido';
import { clp } from '../../lib/format';

/** Cabecera pegajosa: logo, buscador protagonista, sucursal y pedido. */
export function Header() {
  const { estado, dispatch } = useStore();
  const refCab = useRef<HTMLElement>(null);
  const menosMov = usePrefiereMenosMov();
  const suc = useSucursalActual();
  const n = cantidadPedido(estado.pedido);

  /* La barra de categorías se pega justo bajo la cabecera: medimos su alto. */
  useStickyOffset(refCab);

  /* Pulso del contador al crecer */
  const [pulso, setPulso] = useState(false);
  const previo = useRef(n);
  useEffect(() => {
    if (n > previo.current && !menosMov) {
      setPulso(true);
      const t = setTimeout(() => setPulso(false), 460);
      previo.current = n;
      return () => clearTimeout(t);
    }
    previo.current = n;
  }, [n, menosMov]);

  return (
    <header ref={refCab} className="sticky top-0 z-[60] border-b border-linea/60 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="env">
        <div className="flex h-[66px] items-center gap-3.5">
          <Logo />

          <SearchBox className="hidden min-[900px]:flex" />

          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            {/* Selector de sucursal */}
            <BranchPicker className="hidden min-[900px]:flex" />

            <button
              type="button"
              aria-label="Ver mi pedido"
              onClick={() => dispatch({ type: 'abrirCajon', cajon: 'pedido' })}
              className="relative flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-rojo to-rojo-osc px-4 text-[0.92rem] font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-98"
            >
              <Icon id="i-bolsa" className="size-5" />
              <span className="hidden min-[600px]:inline">Mi pedido</span>
              {n > 0 && (
                <>
                  <span
                    className={`num grid h-[22px] min-w-[22px] place-items-center rounded-full bg-white px-1.5 text-[0.76rem] font-extrabold text-rojo shadow-xs ${
                      pulso ? 'animate-late' : ''
                    }`}
                  >
                    {n}
                  </span>
                  <span className="num hidden border-l border-white/30 pl-2 text-[0.88rem] min-[1100px]:inline">
                    {clp(totalPedido(estado.pedido, suc.id))}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Buscador móvil */}
        <div className="pb-3 min-[900px]:hidden">
          <SearchBox placeholder="Buscar remedio o marca…" />
        </div>
      </div>
    </header>
  );
}
