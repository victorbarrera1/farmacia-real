import { useRef } from 'react';
import { Icon } from '../icons/Icon';
import { Banknote, Snowflake, Store } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { usePrefiereMenosMov } from '../../hooks/useMediaQuery';
import { waLink, msgGeneral } from '../../lib/whatsapp';
import { gsap, useGSAP } from '../../lib/gsap';
import type { IconId } from '../../types';

const CRUZ =
  'polygon(37% 0,63% 0,63% 37%,100% 37%,100% 63%,63% 63%,63% 100%,37% 100%,37% 63%,0 63%,0 37%,37% 37%)';

/**
 * Accesos por categoría del hero.
 * Apuntan solo a categorías sin medicamentos de receta: la normativa
 * sanitaria prohíbe la publicidad inductiva de fármacos con receta, así que
 * el hero no promociona la categoría de medicamentos.
 */
const PROMOS: { cat: string; et: string; d: string; ico: IconId }[] = [
  { cat: 'dermo', et: 'Dermocosmética', d: 'Solares, facial y piel sensible', ico: 'i-gota' },
  { cat: 'infantil', et: 'Mamá y bebé', d: 'Fórmulas, pañales y aseo', ico: 'i-bebe' },
  { cat: 'cuidado', et: 'Cuidado personal', d: 'Higiene y cuidado en casa', ico: 'i-corazon' },
  { cat: 'equipos', et: 'Equipos de control', d: 'Presión, glicemia y oximetría', ico: 'i-pulso' },
];

const BENEFICIOS = [
  { Ico: Store, et: 'Reserva tu stock y retíralo en el local' },
  { Ico: Banknote, et: 'Pago presencial en caja, sin cobros en línea' },
  { Ico: Snowflake, et: 'Cadena de frío garantizada' },
];

/** Hero de promociones con CTAs y accesos directos por categoría. */
export function Banner() {
  const { dispatch, anunciar } = useStore();
  const suc = useSucursalActual();
  const menosMov = usePrefiereMenosMov();
  const refHero = useRef<HTMLElement>(null);

  /* Entrada escalonada del contenido y giro lento de las cruces de fondo. */
  useGSAP(() => {
    const mq = gsap.matchMedia();
    mq.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('[data-hero]', { opacity: 0, y: 22 }, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.09,
        delay: 0.1,
      });
      gsap.fromTo('[data-hero-grid]', { opacity: 0, y: 30 }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.45,
      });
      gsap.to('[data-cruz]', {
        rotation: 360,
        duration: 120,
        ease: 'none',
        repeat: -1,
        transformOrigin: 'center',
      });
    });
    return () => mq.revert();
  }, { scope: refHero });

  function irA(cat: string, et: string) {
    dispatch({ type: 'categoria', id: cat });
    anunciar(`Categoría: ${et}`);
    document
      .getElementById('catalogo')
      ?.scrollIntoView({ behavior: menosMov ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <section
      ref={refHero}
      id="inicio"
      className="relative overflow-hidden bg-azul text-white shadow-xl"
      style={{
        backgroundImage:
          'radial-gradient(circle at 85% 15%, rgba(214, 32, 42, 0.22) 0%, transparent 45%), radial-gradient(circle at 10% 85%, rgba(51, 71, 138, 0.35) 0%, transparent 55%), linear-gradient(135deg, var(--color-azul) 0%, var(--color-azul-osc) 100%)'
      }}
    >
      {/* Cruces decorativas de marca con resplandor sutil */}
      <span
        aria-hidden="true"
        data-cruz
        className="pointer-events-none absolute -right-[60px] -top-[70px] size-[320px] bg-white opacity-[0.06] blur-[0.5px]"
        style={{ clipPath: CRUZ }}
      />
      <span
        aria-hidden="true"
        data-cruz
        className="pointer-events-none absolute -bottom-[120px] right-[230px] hidden size-[230px] bg-rojo opacity-[0.14] blur-[0.5px] min-[1100px]:block"
        style={{ clipPath: CRUZ }}
      />

      <div className="env relative z-[2] grid grid-cols-1 items-center gap-8 py-[clamp(32px,6vw,56px)] min-[1000px]:grid-cols-[1.05fr_1fr]">
        <div>
          <span data-hero className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-rojo/90 px-3.5 py-1.5 text-[0.8rem] font-extrabold uppercase tracking-[0.08em] shadow-sm backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
            <Icon id="i-cruz" className="size-3.5" /> Catálogo y reserva
          </span>

          <h1 data-hero className="mt-3.5 max-w-[22ch] drop-shadow-sm">
            Busca tu remedio y revisa si lo tenemos hoy
          </h1>
          <p data-hero className="mt-3 max-w-[54ch] text-[1.05rem] leading-relaxed text-white/90">
            Cada local maneja su propio stock en tiempo real. Elige tu sucursal, arma tu lista y te reservamos los productos para
            retiro en tienda. Sin pagos en línea: el pago y la entrega son presenciales en caja.
          </p>

          <div data-hero className="mt-6 flex flex-wrap gap-3">
            <a href="#catalogo" className="btn btn-blanco flex-auto min-w-[210px] shadow-lg hover:shadow-xl sm:flex-none">
              <Icon id="i-lupa" /> Ver el catálogo
            </a>
            <a
              href={waLink(msgGeneral(suc), suc)}
              target="_blank"
              rel="noopener"
              className="btn btn-wa flex-auto min-w-[210px] shadow-lg hover:shadow-xl sm:flex-none"
            >
              <Icon id="i-wa" /> Consulta por WhatsApp
            </a>
          </div>

          <ul data-hero className="mt-6 flex flex-wrap gap-2.5">
            {BENEFICIOS.map(({ Ico, et }) => (
              <li key={et} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-1.5 text-[0.84rem] font-medium text-white/90 backdrop-blur-sm shadow-sm">
                <Ico className="size-4 shrink-0 text-white/80" aria-hidden="true" /> {et}
              </li>
            ))}
          </ul>
        </div>

        {/* Accesos promocionales por categoría con Glassmorphism */}
        <div data-hero-grid className="grid grid-cols-2 gap-3.5">
          {PROMOS.map((p) => (
            <button
              key={p.cat}
              type="button"
              onClick={() => irA(p.cat, p.et)}
              className="group flex flex-col gap-2.5 rounded-2xl border border-white/15 bg-white/[0.10] p-4.5 text-left shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-white hover:bg-white hover:shadow-2xl"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-white text-azul shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-azul group-hover:text-white">
                <Icon id={p.ico} className="size-[22px]" />
              </span>
              <b className="text-[1.02rem] font-extrabold leading-tight text-white transition-colors duration-200 group-hover:text-azul-osc">
                {p.et}
              </b>
              <span className="text-[0.82rem] leading-snug text-white/80 transition-colors duration-200 group-hover:text-gris">{p.d}</span>
              <span className="mt-auto flex items-center gap-1.5 pt-1.5 text-[0.84rem] font-bold text-white transition-colors duration-200 group-hover:text-rojo">
                Ver productos
                <Icon id="i-flecha" className="size-[15px] transition-transform duration-200 group-hover:translate-x-1.5" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
