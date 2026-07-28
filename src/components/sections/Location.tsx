import { Icon } from '../icons/Icon';
import { SectionHeader } from '../common/SectionHeader';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { textoHoy } from '../../lib/horarios';
import type { ReactNode } from 'react';

function Dato({ ico, et, children }: { ico: 'i-pin' | 'i-tel' | 'i-reloj'; et: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-linea-2 py-[11px] last:border-b-0">
      <Icon id={ico} className="mt-1 size-[18px] shrink-0 text-azul" />
      <div>
        <div className="text-[0.74rem] font-extrabold uppercase tracking-[0.09em] text-gris-2">{et}</div>
        <div className="mt-px text-[0.98rem]">{children}</div>
      </div>
    </div>
  );
}

/** Sección de ubicación: contacto, horarios y mapa de la sucursal actual. */
export function Location() {
  const suc = useSucursalActual();
  const hoy = new Date().getDay();
  const q = encodeURIComponent(suc.mapa);

  return (
    <section id="ubicacion" className="py-[clamp(30px,5vw,52px)]">
      <div className="env">
        <SectionHeader titulo={`Cómo llegar a ${suc.nombre}`}>
          Datos de la sucursal seleccionada. Cambia de local arriba para ver otra.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-4 min-[940px]:grid-cols-[0.85fr_1.15fr] min-[940px]:items-start">
          <div>
            <div className="card p-5">
              <h3 className="mb-3.5 flex items-center gap-[9px]">
                <Icon id="i-pin" className="size-[19px] text-azul" /> Contacto y dirección
              </h3>
              <Dato ico="i-pin" et="Dirección">{suc.direccion}</Dato>
              <Dato ico="i-tel" et="Teléfono · WhatsApp">
                <a href={`tel:${suc.telefono.replace(/\s/g, '')}`} className="font-semibold text-frio">
                  {suc.telefono}
                </a>
              </Dato>
              <Dato ico="i-reloj" et="Ahora">{textoHoy(suc)}</Dato>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
                target="_blank"
                rel="noopener"
                className="btn btn-borde btn-ancho mt-4"
              >
                <Icon id="i-flecha" /> Cómo llegar en Google Maps
              </a>
            </div>

            <div className="card mt-3.5 p-5">
              <h3 className="mb-3.5 flex items-center gap-[9px]">
                <Icon id="i-reloj" className="size-[19px] text-azul" /> Horarios de atención
              </h3>
              <ul>
                {suc.horario.map((t, i) => {
                  const esHoy = t.d.includes(hoy as never);
                  return (
                    <li
                      key={i}
                      className={`flex items-baseline justify-between gap-4 border-b border-linea-2 py-3 text-[0.96rem] last:border-b-0 ${
                        esHoy ? '-mx-2.5 rounded-md border-b-transparent bg-azul-pale px-2.5' : ''
                      }`}
                    >
                      <span className={esHoy ? 'font-extrabold text-azul-osc' : 'text-gris'}>
                        {t.et}
                        {esHoy && <span className="text-azul"> · hoy</span>}
                      </span>
                      <span className={`num font-bold ${esHoy ? 'text-azul-osc' : ''}`}>
                        {t.cerrado ? 'Cerrado' : `${t.abre} – ${t.cierra}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-linea bg-azul-pale aspect-[4/3] min-[940px]:aspect-auto min-[940px]:h-full min-[940px]:min-h-[520px]">
            <iframe
              title="Mapa de la sucursal"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block size-full border-0"
              src={`https://www.google.com/maps?q=${q}&hl=es&z=16&output=embed`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
