import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Lock } from 'lucide-react';
import { Icon } from '../icons/Icon';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { waLink, msgGeneral } from '../../lib/whatsapp';

/** Tira superior de beneficios + accesos rápidos (WhatsApp y panel). */
export function TopBar() {
  const suc = useSucursalActual();

  return (
    <div className="bg-azul-osc text-[0.83rem] text-white">
      <div className="env flex h-9 items-center gap-[18px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex items-center gap-[7px] whitespace-nowrap text-white/90">
          <Icon id="i-pin" className="size-3.5 opacity-85" /> 4 sucursales · Independencia y Ñuñoa
        </span>
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-white/90 min-[560px]:flex">
          <Icon id="i-bolsa" className="size-3.5 opacity-85" /> Retiro en tienda sin pago en línea
        </span>
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-white/90 min-[880px]:flex">
          <ShieldCheck className="size-3.5 opacity-85" aria-hidden="true" /> Bioequivalentes certificados
        </span>
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-white/90 min-[1120px]:flex">
          <Truck className="size-3.5 opacity-85" aria-hidden="true" /> Despacho por el sector
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/panel"
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
            <Icon id="i-wa" className="size-3.5" /> Pide por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
