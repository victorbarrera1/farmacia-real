import { Icon } from '../icons/Icon';
import { SectionHeader } from '../common/SectionHeader';
import type { IconId } from '../../types';

const SERVICIOS: { ico: IconId; t: string; d: string }[] = [
  { ico: 'i-corazon', t: 'Consulta farmacéutica', d: 'Te orientamos sobre dosis, interacciones y qué bioequivalente te sirve por menos plata.' },
  { ico: 'i-pulso', t: 'Control de presión', d: 'Pasa a tomarte la presión sin costo mientras te preparamos el pedido.' },
  { ico: 'i-pastilla', t: 'Tratamientos crónicos', d: 'Te avisamos cuando llega tu remedio y te lo dejamos apartado hasta que puedas venir.' },
  { ico: 'i-moto', t: 'Despacho por el sector', d: 'Coordinamos entrega en Independencia y alrededores. Consulta cobertura por WhatsApp.' },
  { ico: 'i-escudo', t: 'Bioequivalentes certificados', d: 'El mismo principio activo, respaldado por el ISP, a una fracción del precio de marca.' },
  { ico: 'i-bebe', t: 'Mamá y bebé', d: 'Fórmulas, pañales y cuidado infantil siempre disponibles en nuestros locales.' },
];

/** Grilla de servicios de la farmacia. */
export function Services() {
  return (
    <section id="servicios" className="py-[clamp(30px,5vw,52px)]">
      <div className="env">
        <SectionHeader titulo="También te ayudamos con" />
        <div className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2 min-[980px]:grid-cols-3">
          {SERVICIOS.map((s) => (
            <div key={s.t} className="card flex gap-3.5 p-5">
              <span className="grid size-[46px] shrink-0 place-items-center rounded-lg bg-azul-pale text-azul">
                <Icon id={s.ico} className="size-[23px]" />
              </span>
              <div>
                <h3>{s.t}</h3>
                <p className="mt-[5px] text-[0.9rem] leading-relaxed text-gris">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
