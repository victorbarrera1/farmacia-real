import { useState } from 'react';
import { Pencil, Plus, RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import type { Sucursal } from '../../types';
import {
  eliminarSucursal, guardarSucursal, hayEdicionSucursales, nuevoIdSucursal, restaurarSucursales,
  sucursalNueva,
} from '../../data/repo';
import { Icon } from '../../components/icons/Icon';
import { textoHoy } from '../../lib/horarios';
import { useProductos, useSucursales } from '../../hooks/useDatos';
import { SucursalForm } from './SucursalForm';

/** Pestaña de administración de sucursales: crear, editar y eliminar locales. */
export function SucursalesAdmin() {
  const sucursales = useSucursales();
  const productos = useProductos();
  const [editando, setEditando] = useState<Sucursal | null>(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');

  function guardar(s: Sucursal) {
    /* En alta, derivamos un id legible del nombre; en edición se conserva. */
    guardarSucursal({ ...s, id: s.id || nuevoIdSucursal(s.nombre) });
    setEditando(null);
    setAviso('');
  }

  function borrar(id: string) {
    const ok = eliminarSucursal(id);
    setPorBorrar(null);
    setAviso(ok ? '' : 'No se puede eliminar la última sucursal: la tienda necesita al menos una.');
  }

  if (editando) {
    return (
      <SucursalForm
        inicial={editando}
        esNuevo={esNuevo}
        onGuardar={guardar}
        onCancelar={() => setEditando(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[1rem] font-extrabold">Sucursales</h3>
            <p className="mt-0.5 max-w-[68ch] text-[0.82rem] text-gris">
              {sucursales.length} locales · el stock de cada producto está alineado por posición con esta lista, así
              que al crear o eliminar una sucursal se redimensiona el stock de los {productos.length} productos
              (alta = 0 unidades; baja = se quita esa columna).
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Restaurar las 4 sucursales originales y descartar los cambios?')) {
                  restaurarSucursales();
                  setAviso('');
                }
              }}
              className="flex h-11 items-center gap-2 rounded-lg border border-linea bg-white px-3.5 text-[0.88rem] font-bold text-gris transition-colors hover:border-azul hover:text-azul"
            >
              <RotateCcw className="size-4" aria-hidden="true" /> Restaurar sucursales
            </button>
            <button
              type="button"
              onClick={() => { setEditando(sucursalNueva()); setEsNuevo(true); }}
              className="flex h-11 items-center gap-2 rounded-lg bg-azul px-4 text-[0.9rem] font-bold text-white transition-colors hover:bg-azul-osc"
            >
              <Plus className="size-[18px]" aria-hidden="true" /> Nueva sucursal
            </button>
          </div>
        </div>

        {hayEdicionSucursales() && (
          <p className="mt-3 text-[0.8rem] text-gris-2">
            Hay sucursales editadas guardadas en este navegador.
          </p>
        )}

        {aviso && (
          <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-ambar-borde bg-ambar-pale px-3.5 py-2.5 text-[0.88rem] font-bold text-[#6B4A08]">
            <TriangleAlert className="size-[17px] shrink-0 text-ambar" aria-hidden="true" /> {aviso}
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-2">
        {sucursales.map((s, i) => {
          const unidades = productos.reduce((a, p) => a + (p.st[i] ?? 0), 0);
          return (
            <section key={s.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-azul">
                    {s.comuna} · posición {i + 1}
                  </span>
                  <h4 className="mt-1 truncate text-[1.1rem] font-extrabold tracking-[-0.02em]">{s.nombre}</h4>
                  <code className="mt-0.5 block text-[0.74rem] text-gris-2">id: {s.id}</code>
                </div>
                <span className="num shrink-0 rounded-full bg-azul-pale px-3 py-1 text-[0.8rem] font-bold text-azul-osc">
                  {unidades} u.
                </span>
              </div>

              <ul className="mt-3 flex flex-col gap-1.5 text-[0.87rem] text-gris">
                <li className="flex items-start gap-2">
                  <Icon id="i-pin" className="mt-0.5 size-4 shrink-0 text-azul" /> {s.direccion}
                </li>
                <li className="flex items-start gap-2">
                  <Icon id="i-tel" className="mt-0.5 size-4 shrink-0 text-azul" /> {s.telefono || '—'}
                </li>
                <li className="flex items-start gap-2">
                  <Icon id="i-wa" className="mt-0.5 size-4 shrink-0 text-azul" /> +{s.whatsapp}
                </li>
                <li className="flex items-start gap-2">
                  <Icon id="i-reloj" className="mt-0.5 size-4 shrink-0 text-azul" /> {textoHoy(s)}
                </li>
              </ul>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-linea pt-3.5">
                <button
                  type="button"
                  onClick={() => { setEditando(s); setEsNuevo(false); }}
                  className="flex h-10 items-center gap-2 rounded-lg border border-linea px-3 text-[0.86rem] font-bold text-gris hover:border-azul hover:text-azul"
                >
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </button>

                {porBorrar === s.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => borrar(s.id)}
                      className="h-10 rounded-lg bg-rojo px-3 text-[0.84rem] font-bold text-white hover:bg-rojo-osc"
                    >
                      Sí, eliminar y quitar su stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setPorBorrar(null)}
                      className="h-10 rounded-lg border border-linea px-3 text-[0.84rem] font-bold text-gris hover:border-azul hover:text-azul"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPorBorrar(s.id)}
                    disabled={sucursales.length <= 1}
                    className="flex h-10 items-center gap-2 rounded-lg border border-linea px-3 text-[0.86rem] font-bold text-gris hover:border-rojo hover:text-rojo disabled:opacity-40 disabled:hover:border-linea disabled:hover:text-gris"
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Eliminar
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
