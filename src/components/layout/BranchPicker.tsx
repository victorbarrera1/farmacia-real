'use client';

import { ChevronDown, MapPin } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { estaAbierto, textoHoy } from '../../lib/horarios';

/**
 * Selector de sucursal en formato "Retiro en tienda / [sucursal] ▾".
 * Abre el cajón con las sucursales; el stock de toda la tienda depende de esto.
 */
export function BranchPicker({ className = '' }: { className?: string }) {
  const { dispatch } = useStore();
  const suc = useSucursalActual();
  const abierto = estaAbierto(suc);

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'abrirCajon', cajon: 'suc' })}
      aria-haspopup="dialog"
      title={`Retiras en ${suc.nombre} · ${textoHoy(suc)}`}
      className={`h-12 max-w-[270px] items-center gap-2.5 rounded-full border-2 border-azul-borde bg-white px-4 text-left hover:border-azul hover:bg-azul-pale ${className}`}
    >
      <MapPin className="size-[19px] shrink-0 text-azul" aria-hidden="true" />
      <span className="min-w-0 leading-tight">
        <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-gris">
          Retiro en tienda
        </span>
        <b className="flex items-center gap-1.5 truncate text-[0.9rem] font-extrabold text-azul-osc">
          <span
            className={`size-[7px] shrink-0 rounded-full ${abierto ? 'bg-ok' : 'bg-gris-2'}`}
            aria-hidden="true"
          />
          <span className="truncate">{suc.corto}</span>
        </b>
      </span>
      <ChevronDown className="size-4 shrink-0 text-azul" aria-hidden="true" />
    </button>
  );
}
