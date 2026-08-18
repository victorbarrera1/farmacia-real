import { Icon } from '../icons/Icon';
import { SectionHeader } from '../common/SectionHeader';
import { Reveal } from '../common/Reveal';
import type { IconId } from '../../types';

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
    <section id="servicios" className="py-[clamp(36px,6vw,60px)]">
      <div className="env">
        <Reveal>
          <SectionHeader titulo="También te ayudamos con" />
        </Reveal>
        <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[980px]:grid-cols-3">
          {SERVICIOS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.07} className="h-full">
              <div className="card group flex h-full gap-4 p-5.5 transition-all duration-300 hover:-translate-y-1.5 hover:border-azul/25 hover:shadow-hi">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-azul-pale text-azul shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-azul group-hover:text-white">
                  <Icon id={s.ico} className="size-6" />
                </span>
                <div>
                  <h3 className="text-[1.02rem] font-bold text-azul-osc transition-colors group-hover:text-azul">{s.t}</h3>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-gris">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
