import { useMemo, useState } from 'react';
import { Eye, EyeOff, RotateCcw, Search } from 'lucide-react';
import { CATEGORIAS } from '../../data/categorias';
import { fijarPrecioSucursal, fijarStock, fijarVisibilidad } from '../../data/repo';
import { clp, sinTildes } from '../../lib/format';
import { nivelDe } from '../../lib/stock';
import { useProductos, useSucursales } from '../../hooks/useDatos';
import type { Alcance } from './useAdminSesion';

/* ================================================================
   Precios y visibilidad por sucursal.
   ----------------------------------------------------------------
   Es la vista que necesita el encargado de un local: qué productos
   muestra su tienda, a qué precio y con cuántas unidades.

   · Precio en blanco = usa el precio de lista (`p`); con valor = precio
     propio del local (`px[idx]`).
   · El ojo tachado saca el producto del catálogo de ESA sucursal, sin
     borrarlo del sistema.

   El admin general puede elegir cualquier sucursal; el encargado solo ve
   la suya (el servidor lo vuelve a validar en api/productos.ts).
   ================================================================ */
export function AjustesLocal({ alcance }: { alcance: Alcance }) {
  const productos = useProductos();
  const sucursales = useSucursales();
  const [elegida, setElegida] = useState(
    alcance.admin ? sucursales[0]?.id ?? '' : alcance.sucursalId,
  );
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [soloOcultos, setSoloOcultos] = useState(false);

  const idx = sucursales.findIndex((s) => s.id === elegida);
  const sucursal = sucursales[idx];

  const filas = useMemo(() => {
    const q = sinTildes(busqueda.trim());
    return productos.filter((p) => {
      if (categoria !== 'todos' && p.cat !== categoria) return false;
      if (soloOcultos && p.vis[idx] !== false) return false;
      if (!q) return true;
      return sinTildes(`${p.n} ${p.lab} ${p.act}`).includes(q);
    });
  }, [productos, busqueda, categoria, soloOcultos, idx]);

  if (!sucursal) {
    return (
      <section className="card p-5 text-[0.92rem] text-gris">
        Esta sucursal ya no existe. Pide al administrador que la vuelva a crear.
      </section>
    );
  }

  const conPrecioPropio = productos.filter((p) => p.px[idx] !== null).length;
  const ocultos = productos.filter((p) => p.vis[idx] === false).length;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">
          Precios y visibilidad · {sucursal.corto}
        </h1>
        <p className="mt-1 max-w-[74ch] text-[0.92rem] text-gris">
          Define qué muestra la tienda de este local y a qué precio. Si dejas el precio en blanco,
          se usa el de lista. Ocultar un producto no lo borra: solo desaparece del catálogo de esta
          sucursal.
        </p>
      </div>

      <section className="card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-linea p-5">
          <div>
            <h3 className="text-[1rem] font-extrabold">
              {filas.length} de {productos.length} productos
            </h3>
            <p className="mt-0.5 text-[0.82rem] text-gris">
              {conPrecioPropio} con precio propio · {ocultos} ocultos en {sucursal.corto}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {alcance.admin && (
              <select
                value={elegida}
                onChange={(e) => setElegida(e.target.value)}
                aria-label="Sucursal a configurar"
                className="select-orden"
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.corto}</option>
                ))}
              </select>
            )}

            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[0.86rem] font-semibold text-gris">
              <input
                type="checkbox"
                role="switch"
                className="switch"
                checked={soloOcultos}
                onChange={(e) => setSoloOcultos(e.target.checked)}
              />
              Solo ocultos
            </label>

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
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-linea bg-fondo text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-gris-2">
                <th className="px-5 py-3">Producto</th>
                <th className="px-3 py-3 text-right">Precio de lista</th>
                <th className="px-3 py-3 text-center">Precio en {sucursal.corto}</th>
                <th className="px-3 py-3 text-center">Unidades</th>
                <th className="px-5 py-3 text-center">En la tienda</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((p) => {
                const propio = p.px[idx];
                const visible = p.vis[idx] !== false;
                const unidades = p.st[idx] ?? 0;
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-linea-2 last:border-b-0 hover:bg-fondo/60 ${
                      visible ? '' : 'opacity-60'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="text-[0.9rem] font-bold leading-tight text-texto">{p.n}</div>
                      <div className="mt-0.5 text-[0.78rem] text-gris-2">{p.lab} · {p.pres}</div>
                    </td>

                    <td className="num px-3 py-3 text-right text-[0.88rem] text-gris">{clp(p.p)}</td>

                    <td className="px-3 py-3">
                      <div className="mx-auto flex w-fit items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={propio ?? ''}
                          placeholder="de lista"
                          onChange={(e) =>
                            fijarPrecioSucursal(
                              p.id,
                              idx,
                              e.target.value === '' ? null : Number(e.target.value),
                            )
                          }
                          aria-label={`Precio de ${p.n} en ${sucursal.corto}`}
                          className={`num h-10 w-[110px] rounded-lg border px-2.5 text-right text-[0.9rem] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${
                            propio !== null ? 'border-azul bg-azul-pale text-azul-osc' : 'border-linea bg-white'
                          }`}
                        />
                        {propio !== null && (
                          <button
                            type="button"
                            onClick={() => fijarPrecioSucursal(p.id, idx, null)}
                            aria-label={`Volver al precio de lista en ${p.n}`}
                            title="Volver al precio de lista"
                            className="grid size-9 place-items-center rounded-lg border border-linea text-gris hover:border-azul hover:text-azul"
                          >
                            <RotateCcw className="size-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={0}
                        value={unidades}
                        onChange={(e) => fijarStock(p.id, idx, Number(e.target.value))}
                        aria-label={`Unidades de ${p.n} en ${sucursal.corto}`}
                        className={`num mx-auto block h-10 w-20 rounded-lg border border-linea px-2.5 text-center text-[0.9rem] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${
                          nivelDe(unidades) === 'cero'
                            ? 'text-rojo'
                            : nivelDe(unidades) === 'bajo'
                              ? 'text-ambar'
                              : 'text-texto'
                        }`}
                      />
                    </td>

                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => fijarVisibilidad(p.id, idx, !visible)}
                        aria-pressed={visible}
                        className={`mx-auto flex h-10 items-center gap-2 rounded-lg border px-3 text-[0.84rem] font-bold transition-colors ${
                          visible
                            ? 'border-ok-pale bg-ok-pale text-ok hover:border-ok'
                            : 'border-linea bg-white text-gris hover:border-rojo hover:text-rojo'
                        }`}
                      >
                        {visible ? (
                          <><Eye className="size-4" aria-hidden="true" /> Visible</>
                        ) : (
                          <><EyeOff className="size-4" aria-hidden="true" /> Oculto</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filas.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[0.92rem] text-gris">
                    Ningún producto coincide con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
