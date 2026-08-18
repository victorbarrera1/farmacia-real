'use client';

import { useMemo } from 'react';
import type { RangoPrecio } from '../../types';
import { Icon } from '../icons/Icon';
import { CATEGORIAS } from '../../data/categorias';
import { useStore } from '../../store/StoreContext';
import { useProductosDelLocal } from '../../hooks/useCatalogo';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { ET_RANGOS, hayFiltros } from '../../store/state';
import { stockDe } from '../../lib/stock';

const RANGOS_ORDEN: RangoPrecio[] = ['todos', 'hasta5', '5a15', '15a30', 'sobre30'];

/** Categorías permanentes en desktop y facetas reutilizables en drawer móvil. */
export function CatalogFilters({ enCajon = false, mostrarCategorias = true }: { enCajon?: boolean; mostrarCategorias?: boolean }) {
  const { estado, dispatch } = useStore();
  const productos = useProductosDelLocal();
  const suc = useSucursalActual();
  const cuentaCat = (id: string) => id === 'todos' ? productos.length : productos.filter((p) => p.cat === id).length;

  const laboratorios = useMemo(() => {
    const mapa = new Map<string, number>();
    productos
      .filter((p) => estado.categoria === 'todos' || p.cat === estado.categoria)
      .forEach((p) => mapa.set(p.lab, (mapa.get(p.lab) ?? 0) + 1));
    return [...mapa.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
  }, [productos, estado.categoria]);

  const disponibles = productos.filter((p) => stockDe(p, suc.id) > 0).length;

  return (
    <div className={enCajon ? 'py-2' : 'card overflow-hidden p-4'}>
      {!enCajon && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <b className="text-[1rem] font-extrabold">Categorías</b>
          {hayFiltros(estado) && (
            <button type="button" onClick={() => dispatch({ type: 'limpiarFiltros' })} className="text-[0.84rem] font-bold text-rojo hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {mostrarCategorias && (
        <div className="pb-3">
          <ul className="grid gap-1">
            {CATEGORIAS.map((c) => {
              const activa = estado.categoria === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={activa}
                    onClick={() => dispatch({ type: 'categoria', id: c.id })}
                    className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left ${activa ? 'bg-azul text-white' : 'hover:bg-azul-pale'}`}
                  >
                    <Icon id={c.ico} className={`size-[18px] shrink-0 ${activa ? 'text-white' : 'text-azul'}`} />
                    <span className="min-w-0 flex-1 truncate text-[0.91rem] font-bold">{c.et}</span>
                    <span className={`num text-[0.78rem] font-bold ${activa ? 'text-white/80' : 'text-gris-2'}`}>{cuentaCat(c.id)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="faceta">
        <span className="faceta-titulo block">Disponibilidad</span>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.92rem] font-semibold">
          <input type="checkbox" role="switch" className="switch" checked={estado.soloStock} onChange={(e) => dispatch({ type: 'soloStock', on: e.target.checked })} />
          Solo lo que hay hoy
          <span className="num ml-auto text-[0.8rem] font-bold text-gris-2">{disponibles}</span>
        </label>
      </div>

      <div className="faceta">
        <span className="faceta-titulo block">Bioequivalencia</span>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.92rem] font-semibold">
          <input type="checkbox" className="marca" checked={estado.soloBio} onChange={(e) => dispatch({ type: 'soloBio', on: e.target.checked })} />
          Solo bioequivalentes
        </label>
      </div>

      <div className="faceta">
        <span className="faceta-titulo block">Condición de venta</span>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.92rem]">
          <input type="checkbox" className="marca" checked={estado.sinReceta} onChange={(e) => dispatch({ type: 'sinReceta', on: e.target.checked })} /> Sin receta médica
        </label>
      </div>

      <div className="faceta">
        <span className="faceta-titulo block">Precio referencial</span>
        <ul>
          {RANGOS_ORDEN.map((r) => (
            <li key={r}>
              <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[0.92rem]">
                <input type="radio" name={enCajon ? 'precio-cajon' : 'precio-lado'} className="marca" checked={estado.precio === r} onChange={() => dispatch({ type: 'precio', rango: r })} />
                <span className={estado.precio === r ? 'font-bold text-azul-osc' : ''}>{ET_RANGOS[r]}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {laboratorios.length > 1 && (
        <div className="faceta">
          <span className="faceta-titulo block">Laboratorio / marca</span>
          <ul className="max-h-[248px] overflow-y-auto pr-1">
            {laboratorios.map(([lab, n]) => (
              <li key={lab}>
                <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[0.9rem]">
                  <input type="checkbox" className="marca" checked={estado.labs.includes(lab)} onChange={() => dispatch({ type: 'lab', lab })} />
                  <span className={`min-w-0 flex-1 truncate ${estado.labs.includes(lab) ? 'font-bold text-azul-osc' : ''}`}>{lab}</span>
                  <span className="num text-[0.78rem] font-semibold text-gris-2">{n}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
