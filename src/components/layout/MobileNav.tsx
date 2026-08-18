'use client';

import { Home, LayoutGrid, MapPin, ShoppingBag } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { usePrefiereMenosMov } from '../../hooks/useMediaQuery';
import { cantidadPedido, totalPedido } from '../../lib/pedido';
import { clp } from '../../lib/format';

/**
 * Barra de navegación inferior (solo móvil/tablet), como en las apps de
 * farmacia: inicio, categorías, sucursal y pedido con su contador.
 */
export function MobileNav() {
  const { estado, dispatch } = useStore();
  const suc = useSucursalActual();
  const menosMov = usePrefiereMenosMov();
  const n = cantidadPedido(estado.pedido);

  return (
    <nav aria-label="Navegación principal" className="nav-abajo">
      <button
        type="button"
        className="nav-abajo-item"
        onClick={() => window.scrollTo({ top: 0, behavior: menosMov ? 'auto' : 'smooth' })}
      >
        <Home className="size-[21px]" aria-hidden="true" />
        Inicio
      </button>

      <button
        type="button"
        aria-haspopup="dialog"
        data-activo={estado.cajon === 'menu' ? 'si' : 'no'}
        className="nav-abajo-item"
        onClick={() => dispatch({ type: 'abrirCajon', cajon: 'menu' })}
      >
        <LayoutGrid className="size-[21px]" aria-hidden="true" />
        Categorías
      </button>

      <button
        type="button"
        aria-haspopup="dialog"
        data-activo={estado.cajon === 'suc' ? 'si' : 'no'}
        className="nav-abajo-item"
        onClick={() => dispatch({ type: 'abrirCajon', cajon: 'suc' })}
      >
        <MapPin className="size-[21px]" aria-hidden="true" />
        <span className="max-w-[84px] truncate">{suc.corto.split(' ')[0]}</span>
      </button>

      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={n ? `Ver mi pedido, ${n} productos` : 'Ver mi pedido'}
        data-activo={estado.cajon === 'pedido' ? 'si' : 'no'}
        className="nav-abajo-item"
        onClick={() => dispatch({ type: 'abrirCajon', cajon: 'pedido' })}
      >
        <span className="relative">
          <ShoppingBag className="size-[21px]" aria-hidden="true" />
          {n > 0 && (
            <span className="num absolute -right-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rojo px-1 text-[0.66rem] font-extrabold text-white">
              {n}
            </span>
          )}
        </span>
        {n > 0 ? <span className="num">{clp(totalPedido(estado.pedido, suc.id))}</span> : 'Mi pedido'}
      </button>
    </nav>
  );
}
