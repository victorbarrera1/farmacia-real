'use client';

import { useRef } from 'react';
import { Menu, ShoppingBag } from 'lucide-react';
import { Logo } from '../common/Logo';
import { SearchBox } from './SearchBox';
import { BranchPicker } from './BranchPicker';
import { useStore } from '../../store/StoreContext';
import { useStickyOffset } from '../../hooks/useStickyOffset';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { cantidadPedido, totalPedido } from '../../lib/pedido';
import { clp } from '../../lib/format';

/** Cabecera pegajosa: búsqueda protagonista, retiro y pedido. */
export function Header() {
  const { estado, dispatch } = useStore();
  const refCab = useRef<HTMLElement>(null);
  const suc = useSucursalActual();
  const n = cantidadPedido(estado.pedido);

  useStickyOffset(refCab);

  return (
    <header ref={refCab} className="sticky top-0 z-[60] border-b border-linea bg-white shadow-barra">
      <div className="env">
        <div className="flex h-[64px] items-center gap-3">
          <button
            type="button"
            aria-label="Abrir categorías"
            aria-haspopup="dialog"
            onClick={() => dispatch({ type: 'abrirCajon', cajon: 'menu' })}
            className="-ml-1 grid size-11 shrink-0 place-items-center rounded-lg text-azul hover:bg-azul-pale min-[1000px]:hidden"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>

          <Logo />
          <SearchBox className="mx-2 hidden max-w-[650px] min-[780px]:flex" />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <BranchPicker className="hidden min-[1000px]:flex" />
            <button
              type="button"
              aria-label={n ? `Ver mi pedido, ${n} productos` : 'Ver mi pedido'}
              onClick={() => dispatch({ type: 'abrirCajon', cajon: 'pedido' })}
              className="relative flex h-11 items-center gap-2 rounded-full bg-rojo px-3.5 text-[0.94rem] font-bold text-white hover:bg-rojo-osc min-[560px]:px-5"
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              <span className="hidden min-[560px]:inline">Mi pedido</span>
              {n > 0 && (
                <>
                  <span className="num grid h-[23px] min-w-[23px] place-items-center rounded-full bg-white px-1.5 text-[0.78rem] font-extrabold text-rojo">
                    {n}
                  </span>
                  <span className="num hidden border-l border-white/30 pl-2.5 min-[1180px]:inline">
                    {clp(totalPedido(estado.pedido, suc.id))}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="pb-3 min-[780px]:hidden">
          <SearchBox placeholder="Buscar remedio, marca o principio activo" />
        </div>
      </div>
    </header>
  );
}
