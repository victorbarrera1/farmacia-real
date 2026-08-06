import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { Icon } from '../icons/Icon';
import { CATEGORIAS } from '../../data/categorias';
import { useStore } from '../../store/StoreContext';
import { useProductos } from '../../hooks/useDatos';

/**
 * Mega-menú de categorías (patrón Cruz Verde, colores Real).
 * Accesible: botón con aria-expanded/aria-controls, cierre con Escape o clic
 * fuera, foco al primer ítem al abrir y devuelto al botón al cerrar.
 */
export function MegaMenu() {
  const { estado, dispatch, anunciar } = useStore();
  const productos = useProductos();
  const panelId = useId();
  const [abierto, setAbierto] = useState(false);
  const refCaja = useRef<HTMLDivElement>(null);
  const refBoton = useRef<HTMLButtonElement>(null);
  const refPrimero = useRef<HTMLButtonElement>(null);

  /* Escape + clic fuera. */
  useEffect(() => {
    if (!abierto) return;
    refPrimero.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        refBoton.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!refCaja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [abierto]);

  function elegir(id: string, et: string) {
    dispatch({ type: 'categoria', id });
    setAbierto(false);
    refBoton.current?.focus();
    anunciar(`Categoría: ${et}`);
    document.getElementById('catalogo')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  const cuenta = (id: string) =>
    id === 'todos' ? productos.length : productos.filter((p) => p.cat === id).length;

  return (
    <div ref={refCaja} className="relative shrink-0">
      <button
        ref={refBoton}
        type="button"
        aria-label="Categorías"
        aria-expanded={abierto}
        aria-controls={panelId}
        onClick={() => setAbierto((v) => !v)}
        className="flex h-11 items-center gap-2 rounded-lg bg-azul px-4 text-[0.92rem] font-bold text-white transition-colors hover:bg-azul-osc"
      >
        <LayoutGrid className="size-[18px]" aria-hidden="true" />
        <span className="hidden min-[420px]:inline">Categorías</span>
        <ChevronDown
          className={`size-4 transition-transform ${abierto ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        hidden={!abierto}
        className="absolute left-0 top-[calc(100%+8px)] z-[70] w-[min(92vw,660px)] rounded-2xl border border-linea bg-white p-3 shadow-hi"
      >
        <ul className="grid grid-cols-1 gap-1 min-[560px]:grid-cols-2">
          {CATEGORIAS.map((c, i) => {
            const activa = c.id === estado.categoria;
            return (
              <li key={c.id}>
                <button
                  ref={i === 0 ? refPrimero : undefined}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => elegir(c.id, c.et)}
                  className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${
                    activa ? 'bg-azul-pale' : 'hover:bg-fondo'
                  }`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-azul-pale text-azul">
                    <Icon id={c.ico} className="size-[21px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[0.94rem] font-bold text-texto">{c.et}</b>
                    <span className="block truncate text-[0.8rem] text-gris">{c.sub}</span>
                  </span>
                  <span className="num shrink-0 rounded-full bg-fondo px-2 py-0.5 text-[0.76rem] font-bold text-gris">
                    {cuenta(c.id)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
