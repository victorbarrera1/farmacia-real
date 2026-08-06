import { Icon } from '../icons/Icon';
import type { Sucursal } from '../../types';
import { textoHoy } from '../../lib/horarios';

/** Tarjeta de sucursal (seleccionable). Se usa en la grilla y en el cajón. */
export function BranchCard({
  suc,
  elegida,
  onSelect,
}: {
  suc: Sucursal;
  elegida: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={elegida}
      onClick={onSelect}
      className={`group flex h-full flex-col gap-2 rounded-2xl border-2 p-5 text-left transition-colors ${
        elegida
          ? 'border-azul bg-azul-pale'
          : 'border-transparent bg-fondo hover:border-azul-borde hover:bg-azul-pale'
      }`}
    >
      {elegida && (
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-azul px-2.5 py-1 text-[0.72rem] font-extrabold text-white">
          <Icon id="i-check" className="size-3" /> Elegida
        </span>
      )}
      <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-azul">{suc.comuna}</span>
      <span className="text-[1.1rem] font-extrabold leading-tight tracking-[-0.02em]">{suc.nombre}</span>

      <span className="flex items-start gap-[9px] text-[0.88rem] leading-snug text-gris">
        <Icon id="i-pin" className="mt-[3px] size-4 shrink-0 text-azul" />
        {suc.direccion}
      </span>
      <span className="flex items-start gap-[9px] text-[0.88rem] leading-snug text-gris">
        <Icon id="i-reloj" className="mt-[3px] size-4 shrink-0 text-azul" />
        {textoHoy(suc)}
      </span>
      <span className="flex items-start gap-[9px] text-[0.88rem] leading-snug text-gris">
        <Icon id="i-tel" className="mt-[3px] size-4 shrink-0 text-azul" />
        {suc.telefono}
      </span>

      <span className="mt-1 flex items-center gap-[7px] text-[0.9rem] font-bold text-azul">
        {elegida ? 'Viendo este catálogo' : 'Ver el stock de este local'}
        <Icon id="i-flecha" className="size-[15px] transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
}
