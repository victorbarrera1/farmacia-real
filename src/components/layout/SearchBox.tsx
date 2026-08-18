'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent as EventoTeclado } from 'react';
import { Search, X } from 'lucide-react';
import { Ilu } from '../icons/Icon';
import { useStore } from '../../store/StoreContext';
import { useProductosDelLocal } from '../../hooks/useCatalogo';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { sinTildes, clp } from '../../lib/format';
import { precioDe, stockDe } from '../../lib/stock';

/** Búsquedas sugeridas cuando el campo está vacío (sin fármacos de receta). */
const FRECUENTES = ['Paracetamol', 'Vitamina C', 'Protector solar', 'Pañales', 'Alcohol gel'];

/**
 * Buscador protagonista con autocompletado.
 * Varias instancias se sincronizan por el store; el panel de sugerencias es
 * local a cada una. Teclado: ↓/↑ recorre, Enter abre la ficha o busca,
 * Escape cierra el panel.
 */
export function SearchBox({
  placeholder = 'Busca tu remedio, marca o principio activo',
  className = '',
  autoFocus = false,
}: {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const { estado, dispatch, anunciar } = useStore();
  const productos = useProductosDelLocal();
  const suc = useSucursalActual();
  const listaId = useId();

  const refCaja = useRef<HTMLDivElement>(null);
  const refInput = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const q = sinTildes(estado.busqueda.trim());
  const sugerencias = q.length >= 2
    ? productos
        .filter((p) => sinTildes(`${p.n} ${p.lab} ${p.act} ${p.pres}`).includes(q))
        .slice(0, 6)
    : [];

  /* Clic fuera cierra el panel. */
  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (!refCaja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [abierto]);

  useEffect(() => setCursor(-1), [estado.busqueda]);

  function irAlCatalogo() {
    setAbierto(false);
    refInput.current?.blur();
    document.getElementById('catalogo')?.scrollIntoView({ block: 'start' });
  }

  function verFicha(id: string, nombre: string) {
    setAbierto(false);
    dispatch({ type: 'abrirDetalle', id });
    anunciar(`Ficha de ${nombre}`);
  }

  function enTeclado(e: EventoTeclado<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setAbierto(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!sugerencias.length) return;
      e.preventDefault();
      setAbierto(true);
      setCursor((c) => {
        const n = e.key === 'ArrowDown' ? c + 1 : c - 1;
        return (n + sugerencias.length) % sugerencias.length;
      });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const elegida = sugerencias[cursor];
      if (elegida) verFicha(elegida.id, elegida.n);
      else irAlCatalogo();
    }
  }

  const mostrarPanel = abierto && (sugerencias.length > 0 || q.length < 2);

  return (
    <div ref={refCaja} className={`relative min-w-0 flex-1 ${className}`}>
      <div className="busca" role="search">
        <Search className="mr-2.5 size-[21px] shrink-0 text-azul" aria-hidden="true" />
        <input
          ref={refInput}
          type="search"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={mostrarPanel}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-label="Buscar productos del catálogo"
          autoComplete="off"
          placeholder={placeholder}
          value={estado.busqueda}
          onChange={(e) => {
            dispatch({ type: 'busqueda', q: e.target.value });
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={enTeclado}
        />
        {estado.busqueda && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              dispatch({ type: 'busqueda', q: '' });
              refInput.current?.focus();
            }}
            className="grid size-9 shrink-0 place-items-center rounded-full text-gris hover:bg-fondo hover:text-texto"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
        <button type="button" onClick={irAlCatalogo} className="busca-boton" aria-label="Buscar en el catálogo">
          <Search className="size-[19px]" aria-hidden="true" />
        </button>
      </div>

      {mostrarPanel && (
        <div id={listaId} className="sugerencias" role="listbox" aria-label="Sugerencias de búsqueda">
          {q.length < 2 ? (
            <div className="p-2">
              <span className="faceta-titulo block">Búsquedas frecuentes</span>
              <div className="flex flex-wrap gap-2">
                {FRECUENTES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'busqueda', q: t });
                      refInput.current?.focus();
                    }}
                    className="min-h-9 rounded-full bg-fondo px-3.5 text-[0.86rem] font-semibold text-azul-osc hover:bg-azul-pale"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {sugerencias.map((p, i) => {
                const u = stockDe(p, suc.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={i === cursor}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => verFicha(p.id, p.n)}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 text-left ${
                      i === cursor ? 'bg-azul-pale' : 'hover:bg-fondo'
                    }`}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-fondo">
                      <Ilu il={p.il} className="size-[76%]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[0.93rem] font-semibold">{p.n}</b>
                      <span className="block truncate text-[0.79rem] text-gris-2">
                        {p.pres} · {p.lab}
                        {u === 0 && <span className="font-bold text-ambar"> · sin stock hoy</span>}
                      </span>
                    </span>
                    <span className="num shrink-0 text-[0.92rem] font-extrabold">
                      {p.rec ? <span className="text-[0.78rem] font-bold text-azul">Receta</span> : clp(precioDe(p, suc.id))}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={irAlCatalogo}
                className="mt-1 flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-fondo text-[0.88rem] font-bold text-azul hover:bg-azul-pale"
              >
                Ver todos los resultados de “{estado.busqueda.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
