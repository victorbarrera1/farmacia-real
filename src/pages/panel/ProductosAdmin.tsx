import { useMemo, useState } from 'react';
import { Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import type { Producto } from '../../types';
import { CATEGORIAS } from '../../data/categorias';
import {
  eliminarProducto, guardarProducto, hayEdicionProductos, productoNuevo, restaurarProductos,
} from '../../data/repo';
import { Ilu } from '../../components/icons/Icon';
import { clp, sinTildes } from '../../lib/format';
import { nivelDe } from '../../lib/stock';
import { useProductos, useSucursales } from '../../hooks/useDatos';
import { ProductoForm } from './ProductoForm';

const ET_CAT = (id: string) => CATEGORIAS.find((c) => c.id === id)?.et ?? id;

/** Pestaña de administración del catálogo: crear, editar y eliminar productos. */
export function ProductosAdmin() {
  const productos = useProductos();
  const sucursales = useSucursales();
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');
  /** Producto en edición ('nuevo' = alta). */
  const [editando, setEditando] = useState<Producto | null>(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);

  const filas = useMemo(() => {
    const q = sinTildes(busqueda.trim());
    return productos.filter((p) => {
      if (categoria !== 'todos' && p.cat !== categoria) return false;
      if (!q) return true;
      return sinTildes(`${p.n} ${p.lab} ${p.act} ${p.pres}`).includes(q);
    });
  }, [productos, busqueda, categoria]);

  function nuevo() {
    setEditando(productoNuevo());
    setEsNuevo(true);
  }
  function editar(p: Producto) {
    setEditando(p);
    setEsNuevo(false);
  }
  function guardar(p: Producto) {
    guardarProducto(p);
    setEditando(null);
  }

  if (editando) {
    return (
      <ProductoForm
        inicial={editando}
        esNuevo={esNuevo}
        onGuardar={guardar}
        onCancelar={() => setEditando(null)}
      />
    );
  }

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-linea p-5">
        <div>
          <h3 className="text-[1rem] font-extrabold">Catálogo</h3>
          <p className="mt-0.5 text-[0.82rem] text-gris">
            {filas.length} de {productos.length} productos
            {hayEdicionProductos() && ' · con ediciones guardadas en este navegador'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-[18px] text-gris-2" aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto…"
              aria-label="Buscar producto"
              className="h-11 rounded-lg border border-linea bg-white pl-10 pr-3 text-[0.9rem] focus:border-azul focus:outline-none"
            />
          </div>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
            className="select-orden"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>{c.et}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Restaurar el catálogo original y descartar todas las ediciones?')) restaurarProductos();
            }}
            className="flex h-11 items-center gap-2 rounded-lg border border-linea bg-white px-3.5 text-[0.88rem] font-bold text-gris transition-colors hover:border-azul hover:text-azul"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Restaurar catálogo
          </button>
          <button type="button" onClick={nuevo} className="flex h-11 items-center gap-2 rounded-lg bg-azul px-4 text-[0.9rem] font-bold text-white transition-colors hover:bg-azul-osc">
            <Plus className="size-[18px]" aria-hidden="true" /> Nuevo producto
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-linea bg-fondo text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-gris-2">
              <th className="px-5 py-3">Producto</th>
              <th className="px-3 py-3">Categoría</th>
              <th className="px-3 py-3">Sellos</th>
              <th className="px-3 py-3 text-right">Precio</th>
              <th className="px-3 py-3 text-center">Stock total</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((p) => {
              const total = p.st.reduce((a, b) => a + b, 0);
              const nivel = nivelDe(total);
              return (
                <tr key={p.id} className="border-b border-linea-2 last:border-b-0 hover:bg-fondo/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-fondo">
                        <Ilu il={p.il} className="size-8" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.9rem] font-bold leading-tight text-texto">{p.n}</span>
                        <span className="block text-[0.78rem] text-gris-2">{p.lab} · {p.pres}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[0.85rem] text-gris">{ET_CAT(p.cat)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.be && <span className="rounded-sm border border-ambar-borde bg-ambar-pale px-1.5 py-0.5 text-[0.68rem] font-extrabold text-ambar">BE</span>}
                      {p.rec && <span className="rounded-sm border border-rojo-borde bg-rojo-pale px-1.5 py-0.5 text-[0.68rem] font-extrabold text-rojo">Receta</span>}
                      {p.frio && <span className="rounded-sm border border-frio-borde bg-frio-pale px-1.5 py-0.5 text-[0.68rem] font-extrabold text-frio">Frío</span>}
                      {!p.be && !p.rec && !p.frio && <span className="text-[0.8rem] text-gris-2">—</span>}
                    </div>
                  </td>
                  <td className="num px-3 py-3 text-right text-[0.9rem] font-bold tabular-nums">{clp(p.p)}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`num inline-block min-w-[44px] rounded-full px-2.5 py-1 text-[0.82rem] font-bold ${
                        nivel === 'cero'
                          ? 'bg-rojo-pale text-rojo'
                          : nivel === 'bajo'
                            ? 'bg-ambar-pale text-ambar'
                            : 'bg-ok-pale text-ok'
                      }`}
                      title={sucursales.map((s, i) => `${s.corto}: ${p.st[i] ?? 0}`).join(' · ')}
                    >
                      {total}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {porBorrar === p.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[0.8rem] font-semibold text-gris">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={() => { eliminarProducto(p.id); setPorBorrar(null); }}
                          className="h-9 rounded-lg bg-rojo px-3 text-[0.82rem] font-bold text-white hover:bg-rojo-osc"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPorBorrar(null)}
                          className="h-9 rounded-lg border border-linea px-3 text-[0.82rem] font-bold text-gris hover:border-azul hover:text-azul"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editar(p)}
                          aria-label={`Editar ${p.n}`}
                          className="grid size-10 place-items-center rounded-lg border border-linea text-gris hover:border-azul hover:text-azul"
                        >
                          <Pencil className="size-[17px]" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPorBorrar(p.id)}
                          aria-label={`Eliminar ${p.n}`}
                          className="grid size-10 place-items-center rounded-lg border border-linea text-gris hover:border-rojo hover:text-rojo"
                        >
                          <Trash2 className="size-[17px]" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filas.length && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[0.92rem] text-gris">
                  No hay productos que coincidan. Puedes crear uno nuevo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
