import { Icon } from '../icons/Icon';
import { Logo } from '../common/Logo';
import { useStore } from '../../store/StoreContext';
import { useSucursales } from '../../hooks/useDatos';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { waLink, msgGeneral } from '../../lib/whatsapp';
import { PoliciesLink } from '../legal/Policies';

const SECCIONES = [
  { href: '#catalogo', et: 'Catálogo y stock' },
  { href: '#sucursales', et: 'Nuestras sucursales' },
  { href: '#servicios', et: 'Servicios' },
  { href: '#ubicacion', et: 'Cómo llegar' },
];

/** Pie del sitio. */
export function Footer() {
  const { dispatch } = useStore();
  const sucursales = useSucursales();
  const suc = useSucursalActual();

  return (
    <footer className="bg-azul-osc pb-[104px] pt-11 text-white/[0.66]">
      <div className="env">
        <div className="grid grid-cols-1 gap-7 border-b border-white/[0.11] pb-[26px] min-[760px]:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="mb-3">
              <Logo variant="oscuro" />
            </div>
            <p className="max-w-[40ch] text-[0.92rem] leading-relaxed">
              Farmacia de barrio con cuatro locales en Santiago. Remedios, bioequivalentes, dermocosmética y
              cuidado en casa, con atención de verdad.
            </p>
            <div className="mt-4 flex gap-2.5">
              <a
                href="https://instagram.com/farmaciareal4"
                target="_blank"
                rel="noopener"
                aria-label="Instagram de Farmacias Real"
                className="grid size-11 place-items-center rounded-lg bg-white/[0.09] text-white transition-colors hover:bg-white/20"
              >
                <Icon id="i-ig" className="size-[21px]" />
              </a>
              <a
                href={waLink(msgGeneral(suc), suc)}
                target="_blank"
                rel="noopener"
                aria-label="WhatsApp de Farmacias Real"
                className="grid size-11 place-items-center rounded-lg bg-white/[0.09] text-white transition-colors hover:bg-white/20"
              >
                <Icon id="i-wa" className="size-[21px]" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-white">Sucursales</h4>
            <ul>
              {sucursales.map((s) => (
                <li key={s.id} className="py-1.5 text-[0.92rem]">
                  <a
                    href="#ubicacion"
                    onClick={() => dispatch({ type: 'sucursal', id: s.id })}
                    className="text-white/[0.72] no-underline hover:text-white hover:underline"
                  >
                    {s.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-white">Secciones</h4>
            <ul>
              {SECCIONES.map((s) => (
                <li key={s.href} className="py-1.5 text-[0.92rem]">
                  <a href={s.href} className="text-white/[0.72] no-underline hover:text-white hover:underline">
                    {s.et}
                  </a>
                </li>
              ))}
              <li className="py-1.5 text-[0.92rem]">
                <PoliciesLink className="text-left text-white/[0.72] underline decoration-white/40 hover:text-white">
                  Políticas de reserva y términos
                </PoliciesLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-[22px] flex items-start gap-3 rounded-xl border border-white/[0.14] bg-white/[0.06] px-4 py-3.5 text-[0.85rem] leading-relaxed text-white/70">
          <Icon id="i-alerta" className="mt-0.5 size-[18px] shrink-0 text-white/70" />
          <p>
            <b className="font-extrabold text-white">Catálogo informativo con reserva.</b> Este sitio no es una tienda
            de venta en línea: no hay pago con tarjeta ni despacho a domicilio. La reserva se coordina por WhatsApp y
            el pago y la entrega se realizan presencialmente en el local autorizado.{' '}
            <PoliciesLink className="font-bold text-white underline">Ver condiciones completas</PoliciesLink>
          </p>
        </div>

        <p className="mt-[18px] max-w-[86ch] text-[0.79rem] leading-relaxed text-white/40">
          Los precios publicados son referenciales y pueden variar sin previo aviso; el valor final se confirma en
          el local. La disponibilidad mostrada es orientativa y se consolida en el mostrador. Los medicamentos sujetos
          a receta requieren presentación y verificación presencial de receta médica vigente por el Químico
          Farmacéutico de turno. Ante cualquier síntoma, consulta a un profesional de la salud. ©{' '}
          {new Date().getFullYear()} Farmacias Real.
        </p>
      </div>
    </footer>
  );
}
