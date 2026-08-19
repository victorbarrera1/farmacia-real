'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Icon } from '../icons/Icon';
import { Logo } from '../common/Logo';
import { useStore } from '../../store/StoreContext';
import { useSucursales } from '../../hooks/useDatos';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { waLink, msgGeneral } from '../../lib/whatsapp';
import { PoliciesLink } from '../legal/Policies';

function Columna({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false);
  const panelId = useId();
  return <div className="border-t border-white/[0.11] py-1 min-[760px]:border-0 min-[760px]:py-0">
    <h4 className="mb-3 hidden text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-white min-[760px]:block">{titulo}</h4>
    <button type="button" aria-expanded={abierta} aria-controls={panelId} onClick={() => setAbierta((v) => !v)} className="acordeon-boton min-[760px]:hidden">{titulo}<ChevronDown className="size-[18px]" aria-hidden="true" /></button>
    <div id={panelId} className={`pb-2 min-[760px]:block min-[760px]:pb-0 ${abierta ? 'block' : 'hidden'}`}>{children}</div>
  </div>;
}

/** Pie compacto del catálogo informativo. */
export function Footer() {
  const { dispatch } = useStore();
  const sucursales = useSucursales();
  const suc = useSucursalActual();
  return <footer className="bg-azul-osc pb-[calc(78px+env(safe-area-inset-bottom))] pt-9 text-white/[0.7] min-[900px]:pb-10">
    <div className="env">
      <div className="grid grid-cols-1 gap-6 border-b border-white/[0.11] pb-6 min-[760px]:grid-cols-[1.5fr_1fr_1fr]">
        <div><div className="mb-3"><Logo variant="oscuro" /></div><p className="max-w-[40ch] text-[0.92rem] leading-relaxed">Farmacia de barrio con cuatro locales en Santiago. Medicamentos, perfumería y cuidado personal para cotizar y retirar.</p><div className="mt-4 flex gap-2.5"><a href="https://instagram.com/farmaciareal4" target="_blank" rel="noopener" aria-label="Instagram" className="grid size-11 place-items-center rounded-full bg-white/[0.09] text-white hover:bg-white/20"><Icon id="i-ig" className="size-[21px]" /></a><a href={waLink(msgGeneral(suc), suc)} target="_blank" rel="noopener" aria-label="WhatsApp" className="grid size-11 place-items-center rounded-full bg-white/[0.09] text-white hover:bg-white/20"><Icon id="i-wa" className="size-[21px]" /></a></div></div>
        <Columna titulo="Sucursales"><ul>{sucursales.map((s) => <li key={s.id} className="py-1.5 text-[0.92rem]"><a href="#catalogo" onClick={() => dispatch({ type: 'sucursal', id: s.id })} className="text-white/[0.75] no-underline hover:text-white hover:underline">{s.nombre}</a></li>)}</ul></Columna>
        <Columna titulo="Ayuda"><ul><li className="py-1.5"><a href="#catalogo" className="text-white/[0.75] no-underline hover:text-white">Catálogo y stock</a></li><li className="py-1.5"><a href="#sucursales" className="text-white/[0.75] no-underline hover:text-white">Nuestras sucursales</a></li><li className="py-1.5"><PoliciesLink className="text-left text-white/[0.75] underline">Condiciones del catálogo y términos</PoliciesLink></li></ul></Columna>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.14] bg-white/[0.06] px-4 py-3.5 text-[0.85rem] leading-relaxed"><Icon id="i-alerta" className="mt-0.5 size-[18px] shrink-0" /><p><b className="font-extrabold text-white">Catálogo informativo con cotización.</b> No hay pago con tarjeta ni despacho a domicilio. La cotización se coordina por WhatsApp; pago y entrega son presenciales. <PoliciesLink className="font-bold text-white underline">Ver condiciones</PoliciesLink></p></div>
      <p className="mt-4 max-w-[86ch] text-[0.79rem] leading-relaxed text-white/45">Precios referenciales sujetos a confirmación en el local. Los medicamentos con receta requieren validación presencial por el Químico Farmacéutico. © {new Date().getFullYear()} Farmacias Real.</p>
    </div>
  </footer>;
}
