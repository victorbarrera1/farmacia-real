'use client';

import { ChevronDown, MapPin } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { estaAbierto, textoHoy } from '../../lib/horarios';

/**
 * Barra de sucursal para móvil y tablet: dónde retiras y estado del local.
 * Toda la fila abre el selector. En escritorio el picker vive en la cabecera
 * (ver <BranchPicker/>), así que esta barra se oculta.
 */
export function BranchBar() {
  const { dispatch } = useStore();
  const suc = useSucursalActual();
  const abierto = estaAbierto(suc);

  return (
    <div className="border-b border-azul-borde bg-azul-pale min-[900px]:hidden">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dispatch({ type: 'abrirCajon', cajon: 'suc' })}
        className="w-full text-left"
      >
        <span className="env flex min-h-[52px] items-center gap-2.5 py-2">
          <MapPin className="size-[21px] shrink-0 text-azul" aria-hidden="true" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[0.74rem] font-semibold uppercase tracking-[0.06em] text-gris">
              Retiro en tienda
            </span>
            <b className="block truncate text-[0.98rem] font-extrabold text-azul-osc">{suc.corto}</b>
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-azul-borde bg-white px-2.5 py-1 text-[0.78rem] font-bold min-[420px]:inline-flex">
            <span className={`size-[7px] rounded-full ${abierto ? 'bg-ok' : 'bg-gris-2'}`} />
            <span className={abierto ? 'text-ok' : 'text-gris-2'}>{textoHoy(suc)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[0.86rem] font-bold text-azul">
            Cambiar <ChevronDown className="size-4" aria-hidden="true" />
          </span>
        </span>
      </button>
    </div>
  );
}
