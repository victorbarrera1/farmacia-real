import { Reveal } from '../common/Reveal';

const PASOS = [
  { n: 1, t: 'Elige tu sucursal', d: 'El catálogo muestra solo el stock disponible en ese local.' },
  { n: 2, t: 'Arma tu reserva', d: 'Agrega los productos que necesitas. No hay pago en línea ni despacho a domicilio.' },
  { n: 3, t: 'Retira y paga en el local', d: 'Confirmamos disponibilidad por WhatsApp, dejamos tu reserva lista y pagas al retirar en caja.' },
] as const;

/** Tres pasos: cómo funciona el sitio. */
export function Steps() {
  return (
    <section className="border-b border-linea bg-white">
      <div className="env">
        <ul className="grid grid-cols-1 md:grid-cols-3">
          {PASOS.map((p, i) => (
            <Reveal
              as="li"
              key={p.n}
              delay={i * 0.12}
              className={`flex items-start gap-3.5 py-5 md:py-6 md:pr-[22px] ${
                i > 0 ? 'border-t border-linea-2 md:border-l md:border-t-0 md:border-linea md:pl-[22px]' : ''
              }`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-azul-pale text-[1rem] font-extrabold text-azul">
                {p.n}
              </span>
              <div>
                <h3 className="text-[1rem]">{p.t}</h3>
                <p className="mt-[3px] text-[0.9rem] leading-relaxed text-gris">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
