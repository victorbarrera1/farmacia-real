import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { Producto } from '../../types';
import { CATEGORIAS } from '../../data/categorias';
import { ILUSTRACIONES_DISPONIBLES } from '../../data/repo';
import { Ilu } from '../../components/icons/Icon';
import { clp } from '../../lib/format';
import { useSucursales } from '../../hooks/useDatos';

const CATS = CATEGORIAS.filter((c) => c.id !== 'todos');

function Campo({
  et, htmlFor, ayuda, children,
}: {
  et: string;
  htmlFor?: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-[0.82rem] font-bold text-texto">{et}</span>
      {children}
      {ayuda && <span className="mt-1 block text-[0.76rem] text-gris-2">{ayuda}</span>}
    </label>
  );
}

const CLASE_INPUT =
  'mt-1.5 h-11 w-full rounded-lg border border-linea bg-white px-3 text-[0.92rem] focus:border-azul focus:outline-none';

/** Formulario de alta/edición de producto. */
export function ProductoForm({
  inicial, esNuevo, onGuardar, onCancelar,
}: {
  inicial: Producto;
  esNuevo: boolean;
  onGuardar: (p: Producto) => void;
  onCancelar: () => void;
}) {
  const sucursales = useSucursales();
  const [f, setF] = useState<Producto>({ ...inicial, st: sucursales.map((_, i) => inicial.st[i] ?? 0) });
  const [error, setError] = useState('');

  const set = <K extends keyof Producto>(k: K, v: Producto[K]) => setF((prev) => ({ ...prev, [k]: v }));

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.n.trim()) return setError('El nombre del producto es obligatorio.');
    if (!f.pres.trim()) return setError('Indica la presentación (ej. 20 comprimidos).');
    if (!f.lab.trim()) return setError('Indica el laboratorio o marca.');
    if (!Number.isFinite(f.p) || f.p <= 0) return setError('El precio referencial debe ser mayor que 0.');
    setError('');
    onGuardar({ ...f, n: f.n.trim(), pres: f.pres.trim(), lab: f.lab.trim(), act: f.act.trim() || '—' });
  }

  return (
    <form onSubmit={enviar} className="card p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[1.05rem] font-extrabold">{esNuevo ? 'Nuevo producto' : `Editar: ${inicial.n}`}</h3>
          <p className="mt-0.5 text-[0.82rem] text-gris">
            Los cambios se guardan en este navegador y se ven de inmediato en la tienda.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancelar}
          aria-label="Cerrar formulario"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-fondo text-gris hover:bg-linea hover:text-texto"
        >
          <X className="size-[18px]" aria-hidden="true" />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 min-[760px]:grid-cols-2">
        <Campo et="Nombre" htmlFor="f-n">
          <input id="f-n" value={f.n} onChange={(e) => set('n', e.target.value)} className={CLASE_INPUT} required />
        </Campo>

        <Campo et="Presentación" htmlFor="f-pres" ayuda="Ej. 20 comprimidos · 120 ml · Caja 50 un.">
          <input id="f-pres" value={f.pres} onChange={(e) => set('pres', e.target.value)} className={CLASE_INPUT} required />
        </Campo>

        <Campo et="Laboratorio o marca" htmlFor="f-lab">
          <input id="f-lab" value={f.lab} onChange={(e) => set('lab', e.target.value)} className={CLASE_INPUT} required />
        </Campo>

        <Campo et="Principio activo" htmlFor="f-act">
          <input id="f-act" value={f.act} onChange={(e) => set('act', e.target.value)} className={CLASE_INPUT} />
        </Campo>

        <Campo et="Categoría" htmlFor="f-cat">
          <select id="f-cat" value={f.cat} onChange={(e) => set('cat', e.target.value)} className={CLASE_INPUT}>
            {CATS.map((c) => (
              <option key={c.id} value={c.id}>{c.et}</option>
            ))}
          </select>
        </Campo>

        <Campo et="Precio referencial (CLP)" htmlFor="f-p" ayuda={`Se mostrará como ${clp(f.p || 0)}`}>
          <input
            id="f-p"
            type="number"
            min={0}
            step={10}
            value={f.p}
            onChange={(e) => set('p', Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
            className={`num ${CLASE_INPUT}`}
            required
          />
        </Campo>

        <div className="min-[760px]:col-span-2">
          <Campo et="Descripción (opcional)" htmlFor="f-desc" ayuda="Se muestra en la ficha del producto en la tienda.">
            <textarea
              id="f-desc"
              value={f.desc ?? ''}
              onChange={(e) => set('desc', e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-linea bg-white p-3 text-[0.92rem] focus:border-azul focus:outline-none"
            />
          </Campo>
        </div>
      </div>

      {/* Ilustración */}
      <fieldset className="mt-5">
        <legend className="text-[0.82rem] font-bold text-texto">Ilustración</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ILUSTRACIONES_DISPONIBLES.map((il) => {
            const activa = il === f.il;
            return (
              <button
                key={il}
                type="button"
                aria-pressed={activa}
                onClick={() => set('il', il)}
                title={il}
                className={`grid size-16 place-items-center rounded-lg border-2 transition-colors ${
                  activa ? 'border-azul bg-azul-pale' : 'border-linea bg-white hover:border-azul-borde'
                }`}
              >
                <Ilu il={il} className="size-11" />
                <span className="sr-only">{il}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Sellos */}
      <fieldset className="mt-5">
        <legend className="text-[0.82rem] font-bold text-texto">Sellos</legend>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2.5">
          {([
            ['be', 'Bioequivalente'],
            ['rec', 'Requiere receta'],
            ['frio', 'Cadena de frío'],
          ] as const).map(([k, et]) => (
            <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.9rem] font-semibold">
              <input
                type="checkbox"
                role="switch"
                className="switch"
                checked={!!f[k]}
                onChange={(e) => set(k, e.target.checked || undefined)}
              />
              {et}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Stock por sucursal */}
      <fieldset className="mt-5">
        <legend className="text-[0.82rem] font-bold text-texto">Stock por sucursal (unidades)</legend>
        <div className="mt-2 grid grid-cols-2 gap-3 min-[760px]:grid-cols-4">
          {sucursales.map((s, i) => (
            <label key={s.id} className="block">
              <span className="block truncate text-[0.8rem] font-semibold text-gris">{s.corto}</span>
              <input
                type="number"
                min={0}
                value={f.st[i] ?? 0}
                onChange={(e) => {
                  const st = [...f.st];
                  st[i] = Math.max(0, Math.trunc(Number(e.target.value) || 0));
                  set('st', st);
                }}
                aria-label={`Unidades en ${s.corto}`}
                className={`num ${CLASE_INPUT}`}
              />
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-rojo-borde bg-rojo-pale px-3.5 py-2.5 text-[0.88rem] font-bold text-rojo-osc">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2.5 border-t border-linea pt-4">
        <button type="submit" className="btn btn-azul">
          <Save className="size-[19px]" aria-hidden="true" /> {esNuevo ? 'Crear producto' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancelar} className="btn btn-borde">
          Cancelar
        </button>
      </div>
    </form>
  );
}
