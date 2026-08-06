import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { Logo } from '../common/Logo';
import { SearchBox } from './SearchBox';
import { BranchPicker } from './BranchPicker';
import { useStore } from '../../store/StoreContext';
import { useStickyOffset } from '../../hooks/useStickyOffset';
import { usePrefiereMenosMov } from '../../hooks/useMediaQuery';
import { cantidadPedido, totalPedido } from '../../lib/pedido';
import { clp } from '../../lib/format';

/** Cabecera pegajosa: logo, buscador protagonista, sucursal y pedido. */
export function Header() {
  const { estado, dispatch } = useStore();
  const refCab = useRef<HTMLElement>(null);
  const menosMov = usePrefiereMenosMov();
  const n = cantidadPedido(estado.pedido);

  /* La barra de categorías se pega justo bajo la cabecera: medimos su alto. */
  useStickyOffset(refCab);

  /* Pulso del contador al crecer (guiño de "se agregó"). */
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
    <header ref={refCab} className="sticky top-0 z-[60] bg-white shadow-[0_1px_0_var(--color-linea)]">
      <div className="env">
        <div className="flex h-[62px] items-center gap-3">
          <Logo />

          <SearchBox className="hidden min-[900px]:flex" />

          <div className="ml-auto flex shrink-0 items-center gap-[9px]">
            {/* Selector de sucursal: en móvil vive en la BranchBar de abajo. */}
            <BranchPicker className="hidden min-[900px]:flex" />

            <button
              type="button"
              aria-label="Ver mi pedido"
              onClick={() => dispatch({ type: 'abrirCajon', cajon: 'pedido' })}
              className="relative flex h-11 items-center gap-[9px] rounded-lg bg-rojo px-4 text-[0.94rem] font-bold text-white transition-colors hover:bg-rojo-osc"
            >
              <Icon id="i-bolsa" className="size-5" />
              <span className="hidden min-[600px]:inline">Mi pedido</span>
              {n > 0 && (
                <>
                  <span
                    className={`num grid h-[23px] min-w-[23px] place-items-center rounded-full bg-white px-1.5 text-[0.78rem] font-extrabold text-rojo ${
                      pulso ? 'animate-late' : ''
                    }`}
                  >
                    {n}
                  </span>
                  <span className="num hidden border-l border-white/30 pl-[9px] text-[0.9rem] min-[1100px]:inline">
                    {clp(totalPedido(estado.pedido))}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Buscador móvil, en segunda línea */}
        <div className="pb-[11px] min-[900px]:hidden">
          <SearchBox placeholder="Buscar remedio o marca…" />
        </div>
      </div>
    </header>
  );
}
