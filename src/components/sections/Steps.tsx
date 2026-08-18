import { Reveal } from '../common/Reveal';

const PASOS = [
  { n: '1', t: 'Elige tu sucursal', d: 'El catálogo muestra el stock actualizado disponible en ese local específico.' },
  { n: '2', t: 'Arma tu reserva', d: 'Agrega los medicamentos y productos que necesitas en tu lista de pedido.' },
  { n: '3', t: 'Retira y paga en local', d: 'Confirmamos por WhatsApp, dejamos tu paquete listo y pagas al retirar en caja.' },
] as const;

/** Tres pasos: cómo funciona el sitio. */
export function Steps() {
  return (
    <section className="relative -mt-3 z-10 py-6">
      <div className="env">
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {PASOS.map((p, i) => (
            <Reveal
              as="div"
              key={p.n}
              delay={i * 0.1}
              className="card group flex items-start gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-azul/25 hover:shadow-hi"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-azul-pale to-azul-borde/40 text-[1.1rem] font-extrabold text-azul shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-azul group-hover:text-white">
                {p.n}
              </span>
              <div>
                <h3 className="text-[1.02rem] font-bold text-azul-osc transition-colors group-hover:text-azul">{p.t}</h3>
                <p className="mt-1 text-[0.88rem] leading-relaxed text-gris">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
