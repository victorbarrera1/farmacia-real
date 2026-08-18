import { Icon } from '../icons/Icon';
import type { Sucursal } from '../../types';
import { estaAbierto, textoHoy } from '../../lib/horarios';

/** Tarjeta compacta de sucursal para selector y bloque institucional. */
export function BranchCard({ suc, elegida, onSelect }: { suc: Sucursal; elegida: boolean; onSelect: () => void }) {
  const abierto = estaAbierto(suc);
  return (
    <button
      type="button"
      aria-pressed={elegida}
      onClick={onSelect}
      className={`flex h-full min-h-[170px] flex-col gap-2 rounded-xl border p-4 text-left ${
        elegida ? 'border-azul bg-azul-pale' : 'border-linea bg-white hover:border-azul-borde'
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-azul">{suc.comuna}</span>
        {elegida && <span className="rounded-full bg-azul px-2 py-0.5 text-[0.7rem] font-bold text-white">Elegida</span>}
      </span>
      <strong className="text-[1.02rem] font-extrabold leading-tight">{suc.nombre}</strong>
      <span className="flex items-start gap-2 text-[0.84rem] leading-snug text-gris">
        <Icon id="i-pin" className="mt-0.5 size-4 shrink-0 text-azul" /> {suc.direccion}
      </span>
      <span className={`mt-auto flex items-center gap-2 text-[0.82rem] font-bold ${abierto ? 'text-ok' : 'text-gris'}`}>
        <span className={`size-2 rounded-full ${abierto ? 'bg-ok' : 'bg-gris-2'}`} /> {textoHoy(suc)}
      </span>
      <span className="font-bold text-azul">{elegida ? 'Viendo este local' : 'Ver stock de este local'}</span>
    </button>
  );
}
