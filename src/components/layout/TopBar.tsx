import Link from 'next/link';
import { Banknote, Lock, Store } from 'lucide-react';
import { Icon } from '../icons/Icon';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { waLink, msgGeneral } from '../../lib/whatsapp';

/** Tira superior con el modelo de operación + accesos rápidos (WhatsApp y panel). */
export function TopBar() {
  const suc = useSucursalActual();

  return (
    <div className="bg-azul-osc text-[0.83rem] text-white">
      <div className="env flex h-9 items-center gap-[18px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex items-center gap-[7px] whitespace-nowrap text-white/90">
          <Icon id="i-pin" className="size-3.5 opacity-85" /> 4 sucursales · Independencia y Ñuñoa
        </span>
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-white/90 min-[560px]:flex">
          <Store className="size-3.5 opacity-85" aria-hidden="true" /> Reserva por WhatsApp y retiro en el local
        </span>
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-white/90 min-[900px]:flex">
          <Banknote className="size-3.5 opacity-85" aria-hidden="true" /> Pago presencial en caja
        </span>
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-white/90 min-[1500px]:flex">
          <Icon id="i-escudo" className="size-3.5 opacity-85" /> Atención de Químico Farmacéutico
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/panel"
            className="flex items-center gap-[6px] whitespace-nowrap rounded-full border border-white/25 px-3 py-[3px] font-bold text-white no-underline transition-colors hover:bg-white/10"
          >
            <Lock className="size-3.5" aria-hidden="true" /> Admin
          </Link>
          <a
            href={waLink(msgGeneral(suc), suc)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-[7px] whitespace-nowrap font-bold text-white no-underline hover:underline"
          >
            <Icon id="i-wa" className="size-3.5" /> Consulta por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
