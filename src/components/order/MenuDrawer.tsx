'use client';

import { MapPin, Store } from 'lucide-react';
import { Drawer } from './Drawer';
import { Icon } from '../icons/Icon';
import { PoliciesLink } from '../legal/Policies';
import { CATEGORIAS } from '../../data/categorias';
import { useStore } from '../../store/StoreContext';
import { useProductosDelLocal } from '../../hooks/useCatalogo';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { stockDe } from '../../lib/stock';
import { waLink, msgGeneral } from '../../lib/whatsapp';

/** Menú móvil instantáneo: categorías, sucursal y ayuda. */
export function MenuDrawer() {
  const { estado, dispatch, anunciar } = useStore();
  const productos = useProductosDelLocal();
  const suc = useSucursalActual();

  function elegir(id: string, et: string) {
    dispatch({ type: 'categoria', id });
    dispatch({ type: 'cerrarCajones' });
    anunciar(`Categoría: ${et}`);
    document.getElementById('catalogo')?.scrollIntoView({ block: 'start' });
  }

  return (
    <Drawer abierto={estado.cajon === 'menu'} onClose={() => dispatch({ type: 'cerrarCajones' })} titulo="Categorías" subtitulo={`Stock de ${suc.corto}`} labelId="tMenu" cerrarLabel="Cerrar menú">
      <ul className="py-1">
        {CATEGORIAS.map((c) => {
          const lista = c.id === 'todos' ? productos : productos.filter((p) => p.cat === c.id);
          const hoy = lista.filter((p) => stockDe(p, suc.id) > 0).length;
          return <li key={c.id}>
            <button type="button" aria-pressed={estado.categoria === c.id} onClick={() => elegir(c.id, c.et)} className={`flex min-h-[58px] w-full items-center gap-3 rounded-lg p-2.5 text-left ${estado.categoria === c.id ? 'bg-azul text-white' : 'hover:bg-fondo'}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${estado.categoria === c.id ? 'bg-white/15 text-white' : 'bg-azul-pale text-azul'}`}><Icon id={c.ico} className="size-[21px]" /></span>
              <span className="min-w-0 flex-1"><b className="block truncate text-[0.96rem] font-bold">{c.et}</b><span className={`block truncate text-[0.8rem] ${estado.categoria === c.id ? 'text-white/75' : 'text-gris'}`}>{c.sub}</span></span>
              <span className={`num shrink-0 rounded-full px-2 py-0.5 text-[0.76rem] font-bold ${estado.categoria === c.id ? 'bg-white/15 text-white' : 'bg-fondo text-gris'}`}>{hoy}</span>
            </button>
          </li>;
        })}
      </ul>

      <div className="mt-2 border-t border-linea pt-3">
        <button type="button" onClick={() => dispatch({ type: 'abrirCajon', cajon: 'suc' })} className="flex min-h-12 w-full items-center gap-2.5 rounded-lg bg-azul-pale px-3 text-left text-[0.94rem] font-bold text-azul-osc hover:bg-azul hover:text-white">
          <Store className="size-[19px] shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">Cambiar de sucursal</span><MapPin className="size-4" aria-hidden="true" />
        </button>
        <a href="#sucursales" onClick={() => dispatch({ type: 'cerrarCajones' })} className="mt-1 flex min-h-12 items-center rounded-lg px-3 font-semibold text-texto no-underline hover:bg-fondo">Nuestras sucursales</a>
        <PoliciesLink className="flex min-h-12 w-full items-center rounded-lg px-3 text-left font-semibold text-texto hover:bg-fondo">Condiciones del catálogo y términos</PoliciesLink>
        <a href={waLink(msgGeneral(suc), suc)} target="_blank" rel="noopener" className="btn btn-wa btn-ancho mt-2"><Icon id="i-wa" /> Consultar por WhatsApp</a>
      </div>
    </Drawer>
  );
}
