'use client';

import { Icon } from '../icons/Icon';
import { FiltersRow } from './FiltersRow';
import { CatalogFilters } from './CatalogFilters';
import { ProductCard } from './ProductCard';
import { EmptyState } from './EmptyState';
import { PoliciesLink } from '../legal/Policies';
import { CATEGORIAS } from '../../data/categorias';
import { useCatalogo } from '../../hooks/useCatalogo';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';

/** Catálogo search-first: sidebar permanente en desktop y resultados inmediatos. */
export function Catalog() {
  const lista = useCatalogo();
  const suc = useSucursalActual();
  const { estado } = useStore();
  const cat = CATEGORIAS.find((c) => c.id === estado.categoria);
  const titulo = !cat || cat.id === 'todos' ? 'Todos los productos' : cat.et;

  return (
    <section id="catalogo" className="bg-fondo py-5 min-[760px]:py-7">
      <div className="env">
        <div className="grid grid-cols-1 gap-5 min-[1000px]:grid-cols-[266px_minmax(0,1fr)] min-[1000px]:items-start">
          <aside
            aria-label="Categorías y filtros del catálogo"
            className="sidebar-catalogo hidden min-[1000px]:sticky min-[1000px]:block"
            style={{ top: 'calc(var(--top-nav) + 16px)' }}
          >
            <CatalogFilters />
          </aside>

          <div className="min-w-0">
            <nav aria-label="Ubicación" className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[0.82rem] text-gris">
              <span className="font-bold text-azul">{suc.corto}</span>
              <span aria-hidden="true">›</span>
              <span>{cat?.id === 'todos' ? 'Catálogo' : cat?.et}</span>
            </nav>

            <div className="mb-4 border-b border-linea pb-4">
              <h1 className="text-[clamp(1.5rem,3vw,2rem)]">
                ¿Qué estás buscando hoy?
              </h1>
              <p className="mt-1 text-[0.95rem] text-gris">
                {titulo} disponibles para retiro en <b className="font-bold text-texto">{suc.nombre}</b>.
                Busca, filtra y arma tu reserva para enviarla por WhatsApp.
              </p>
            </div>

            <FiltersRow lista={lista} />

            <div className="grid grid-cols-1 gap-3 min-[375px]:grid-cols-2 min-[680px]:grid-cols-3 min-[1180px]:grid-cols-4">
              {lista.length ? (
                lista.map((p) => <ProductCard key={p.id} p={p} />)
              ) : (
                <div className="col-span-full"><EmptyState /></div>
              )}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-ambar-borde bg-ambar-pale px-4 py-3.5 text-[0.88rem] leading-relaxed text-[#6B4A08]">
              <Icon id="i-alerta" className="mt-0.5 size-5 shrink-0 text-ambar" />
              <p>
                <b className="font-extrabold">Recetas y retiro.</b> Los productos marcados <em>Receta</em> se entregan
                solo con receta vigente validada presencialmente. No hay pago en línea ni despacho: el pago y la
                entrega son en el local.{' '}
                <PoliciesLink className="font-extrabold text-azul underline">Ver condiciones</PoliciesLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
