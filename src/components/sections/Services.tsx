import { Icon } from '../icons/Icon';
import { SectionHeader } from '../common/SectionHeader';
import { Reveal } from '../common/Reveal';
import type { IconId } from '../../types';

/* Servicios de la farmacia. Redacción neutral e informativa: no se
   promocionan medicamentos ni se comparan precios de fármacos, y no se
   ofrece despacho (el retiro y el pago son presenciales). */
const SERVICIOS: { ico: IconId; t: string; d: string }[] = [
  { ico: 'i-corazon', t: 'Consulta farmacéutica', d: 'El Químico Farmacéutico de turno te orienta sobre el uso correcto de tus medicamentos y resuelve dudas del tratamiento.' },
  { ico: 'i-pulso', t: 'Control de presión', d: 'Pasa a tomarte la presión sin costo mientras preparamos tu reserva.' },
  { ico: 'i-bolsa', t: 'Reserva y retiro en tienda', d: 'Reservas tu stock por WhatsApp y lo retiras en el local. El pago se realiza presencialmente en caja.' },
  { ico: 'i-pastilla', t: 'Tratamientos crónicos', d: 'Te avisamos cuando llega tu medicamento y lo dejamos reservado hasta que puedas venir a retirarlo.' },
  { ico: 'i-escudo', t: 'Recetas físicas y electrónicas', d: 'Revisamos y validamos tu receta en el local, como exige la normativa sanitaria, antes de la entrega.' },
  { ico: 'i-bebe', t: 'Mamá y bebé', d: 'Fórmulas, pañales y cuidado infantil disponibles en nuestros locales.' },
];

/** Grilla de servicios de la farmacia. */
export function Services() {
  return (
    <section id="servicios" className="py-[clamp(30px,5vw,52px)]">
      <div className="env">
        <Reveal>
          <SectionHeader titulo="También te ayudamos con" />
        </Reveal>
        <div className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2 min-[980px]:grid-cols-3">
          {SERVICIOS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08} className="h-full">
              <div className="card flex h-full gap-3.5 p-5">
                <span className="grid size-[46px] shrink-0 place-items-center rounded-lg bg-azul-pale text-azul">
                  <Icon id={s.ico} className="size-[23px]" />
                </span>
                <div>
                  <h3>{s.t}</h3>
                  <p className="mt-[5px] text-[0.9rem] leading-relaxed text-gris">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
