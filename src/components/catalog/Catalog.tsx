import { Icon } from '../icons/Icon';
import { FiltersRow } from './FiltersRow';
import { ProductCard } from './ProductCard';
import { EmptyState } from './EmptyState';
import { useCatalogo } from '../../hooks/useCatalogo';
import { useSucursalActual } from '../../hooks/useSucursalActual';

/** Sección de catálogo: filtros + grilla de productos + aviso de recetas. */
export function Catalog() {
  const lista = useCatalogo();
  const suc = useSucursalActual();

  return (
    <section id="catalogo" className="py-[clamp(30px,5vw,52px)]">
      <div className="env">
        <div className="mb-5">
          <h2>
            Disponible en <span>{suc.nombre}</span>
          </h2>
          <p className="mt-[5px] max-w-[56ch] text-[0.95rem] text-gris">
            Precios referenciales. Confirmamos disponibilidad y valor final por WhatsApp antes de tu retiro.
          </p>
        </div>

        <FiltersRow lista={lista} />

        <div className="grid grid-cols-2 gap-3 min-[680px]:grid-cols-3 min-[1000px]:grid-cols-4 min-[1240px]:grid-cols-5">
          {lista.length ? lista.map((p) => <ProductCard key={p.id} p={p} />) : <EmptyState />}
        </div>

        <div className="mt-[22px] flex items-start gap-3 rounded-2xl border border-ambar-borde bg-ambar-pale px-[18px] py-4 text-[0.9rem] leading-relaxed text-[#6B4A08]">
          <Icon id="i-alerta" className="mt-0.5 size-[21px] shrink-0 text-ambar" />
          <div>
            <b className="font-extrabold">Sobre las recetas.</b> Los productos marcados <em>Receta</em> necesitan
            que traigas la receta médica al local cuando vengas a retirar. Si tienes dudas, escríbenos y te decimos
            exactamente qué necesitas. Esta página no reemplaza la indicación de un profesional de la salud.
          </div>
        </div>
      </div>
    </section>
  );
}
