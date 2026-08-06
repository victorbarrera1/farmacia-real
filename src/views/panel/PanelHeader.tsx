import Link from 'next/link';
import { LogOut, MapPin, ShieldCheck, Store } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { useSucursales } from '../../hooks/useDatos';
import type { Alcance } from './useAdminSesion';

/** Cabecera del panel de gestión, con el alcance de la sesión a la vista. */
export function PanelHeader({ alcance, onSalir }: { alcance: Alcance; onSalir: () => void }) {
  const sucursales = useSucursales();
  const suya = sucursales.find((s) => s.id === alcance.sucursalId);

  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-white shadow-[0_1px_0_var(--color-linea)]">
      <div className="env flex h-[58px] items-center gap-3">
        <Logo showTagline={false} />
        <span className="hidden items-center gap-2 border-l border-linea pl-3 text-[0.9rem] font-bold text-gris min-[560px]:flex">
          Panel de gestión
        </span>

        {alcance.admin ? (
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-azul-pale px-3 py-1 text-[0.78rem] font-extrabold text-azul-osc">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Admin general
          </span>
        ) : (
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-rojo-pale px-3 py-1 text-[0.78rem] font-extrabold text-rojo-osc">
            <MapPin className="size-3.5" aria-hidden="true" />
            <span className="hidden min-[520px]:inline">Sucursal:&nbsp;</span>
            {suya?.corto ?? alcance.sucursalId}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSalir}
            className="flex h-10 items-center gap-2 rounded-lg border border-linea bg-white px-3 text-[0.88rem] font-bold text-gris transition-colors hover:border-rojo hover:text-rojo"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden min-[420px]:inline">Salir</span>
          </button>
          <Link
            href="/"
            className="flex h-10 items-center gap-2 rounded-lg bg-azul px-3.5 text-[0.88rem] font-bold text-white transition-colors hover:bg-azul-osc"
          >
            <Store className="size-4" aria-hidden="true" />
            <span className="hidden min-[420px]:inline">Ver tienda</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
