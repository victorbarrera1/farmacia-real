'use client';

import Link from 'next/link';
import { Banknote, Lock, MapPin, Store } from 'lucide-react';
import { Icon } from '../icons/Icon';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { waLink, msgGeneral } from '../../lib/whatsapp';

/** Tira superior: modelo de operación + accesos rápidos (sucursales, WhatsApp, panel). */
export function TopBar() {
  const suc = useSucursalActual();

  return (
    <div className="bg-azul-osc text-[0.83rem] text-white">
      <div className="env flex h-9 items-center gap-5 overflow-x-auto sin-barra">
        <span className="flex items-center gap-[7px] whitespace-nowrap text-white/90">
          <Store className="size-3.5 opacity-85" aria-hidden="true" /> Cotiza y retira en tu local
        </span>
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-white/90 min-[620px]:flex">
          <Banknote className="size-3.5 opacity-85" aria-hidden="true" /> Pago presencial en caja
        </span>
        <span className="hidden items-center gap-[7px] whitespace-nowrap text-white/90 min-[1100px]:flex">
          <Icon id="i-escudo" className="size-3.5 opacity-85" /> Atención de Químico Farmacéutico
        </span>

        <div className="ml-auto flex items-center gap-4">
          <a
            href="#sucursales"
            className="hidden items-center gap-[6px] whitespace-nowrap font-bold text-white no-underline hover:underline min-[520px]:flex"
          >
            <MapPin className="size-3.5" aria-hidden="true" /> Nuestras sucursales
          </a>
          <a
            href={waLink(msgGeneral(suc), suc)}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-[7px] whitespace-nowrap font-bold text-white no-underline hover:underline"
          >
            <Icon id="i-wa" className="size-3.5" /> Escríbenos
          </a>
          <Link
            href="/panel"
            className="flex items-center gap-[6px] whitespace-nowrap rounded-full border border-white/25 px-3 py-[3px] font-bold text-white no-underline hover:bg-white/10"
          >
            <Lock className="size-3.5" aria-hidden="true" /> Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
