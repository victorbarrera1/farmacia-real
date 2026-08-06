import { useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import type { Dia, Sucursal, Tramo } from '../../types';

const DIAS: { d: Dia; et: string }[] = [
  { d: 1, et: 'L' }, { d: 2, et: 'M' }, { d: 3, et: 'M' }, { d: 4, et: 'J' },
  { d: 5, et: 'V' }, { d: 6, et: 'S' }, { d: 0, et: 'D' },
];

const CLASE_INPUT =
  'mt-1.5 h-11 w-full rounded-lg border border-linea bg-white px-3 text-[0.92rem] focus:border-azul focus:outline-none';

function Campo({ et, htmlFor, ayuda, children }: {
  et: string; htmlFor?: string; ayuda?: string; children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-[0.82rem] font-bold text-texto">{et}</span>
      {children}
      {ayuda && <span className="mt-1 block text-[0.76rem] text-gris-2">{ayuda}</span>}
    </label>
  );
}

const tramoNuevo = (): Tramo => ({ d: [1], et: 'Nuevo tramo', abre: '09:00', cierra: '20:00' });

/** Formulario de alta/edición de sucursal, con editor de horarios por tramos. */
export function SucursalForm({
  inicial, esNuevo, onGuardar, onCancelar,
}: {
  inicial: Sucursal;
  esNuevo: boolean;
  onGuardar: (s: Sucursal) => void;
  onCancelar: () => void;
}) {
  const [f, setF] = useState<Sucursal>(inicial);
  const [error, setError] = useState('');

  const set = <K extends keyof Sucursal>(k: K, v: Sucursal[K]) => setF((prev) => ({ ...prev, [k]: v }));

  function setTramo(i: number, t: Tramo) {
    const horario = [...f.horario];
    horario[i] = t;
    set('horario', horario);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nombre.trim()) return setError('El nombre de la sucursal es obligatorio.');
    if (!f.direccion.trim()) return setError('La dirección es obligatoria.');
    const wa = f.whatsapp.replace(/\D/g, '');
    if (wa.length < 11) {
      return setError('El WhatsApp debe incluir código de país, sin signos. Ej: 56940184554');
    }
    setError('');
    onGuardar({
      ...f,
      nombre: f.nombre.trim(),
      corto: f.corto.trim() || f.nombre.trim(),
      comuna: f.comuna.trim() || '—',
      direccion: f.direccion.trim(),
      telefono: f.telefono.trim(),
      whatsapp: wa,
      mapa: f.mapa.trim() || f.direccion.trim(),
    });
  }

  return (
    <form onSubmit={enviar} className="card p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[1.05rem] font-extrabold">
            {esNuevo ? 'Nueva sucursal' : `Editar: ${inicial.nombre}`}
          </h3>
          <p className="mt-0.5 max-w-[64ch] text-[0.82rem] text-gris">
            Cada sucursal tiene su propio WhatsApp y su propio stock. Al crear una sucursal, todos los productos
            quedan con 0 unidades en ella.
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
        <Campo et="Nombre" htmlFor="s-nombre" ayuda="Ej. Independencia 1443">
          <input id="s-nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} className={CLASE_INPUT} required />
        </Campo>

        <Campo et="Nombre corto" htmlFor="s-corto" ayuda="Se usa en chips, tablas y el selector.">
          <input id="s-corto" value={f.corto} onChange={(e) => set('corto', e.target.value)} className={CLASE_INPUT} />
        </Campo>

        <Campo et="Comuna" htmlFor="s-comuna">
          <input id="s-comuna" value={f.comuna} onChange={(e) => set('comuna', e.target.value)} className={CLASE_INPUT} />
        </Campo>

        <Campo et="Dirección" htmlFor="s-dir">
          <input id="s-dir" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} className={CLASE_INPUT} required />
        </Campo>

        <Campo et="Teléfono" htmlFor="s-tel" ayuda="Formato visible. Ej. +56 9 4018 4554">
          <input id="s-tel" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} className={CLASE_INPUT} />
        </Campo>

        <Campo et="WhatsApp (solo dígitos)" htmlFor="s-wa" ayuda="Con código de país, sin + ni espacios. Ej. 56940184554">
          <input
            id="s-wa"
            value={f.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            className={`num ${CLASE_INPUT}`}
            required
          />
        </Campo>

        <div className="min-[760px]:col-span-2">
          <Campo et="Consulta para el mapa" htmlFor="s-mapa" ayuda="Texto que se envía a Google Maps. Ej. Av. Independencia 1443, Independencia, Chile">
            <input id="s-mapa" value={f.mapa} onChange={(e) => set('mapa', e.target.value)} className={CLASE_INPUT} />
          </Campo>
        </div>
      </div>

      {/* Horarios */}
      <fieldset className="mt-5">
        <legend className="text-[0.82rem] font-bold text-texto">Horarios de atención</legend>
        <div className="mt-2 flex flex-col gap-3">
          {f.horario.map((t, i) => (
            <div key={i} className="rounded-xl border border-linea bg-fondo p-3.5">
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[180px] flex-1">
                  <span className="block text-[0.78rem] font-semibold text-gris">Etiqueta</span>
                  <input
                    value={t.et}
                    onChange={(e) => setTramo(i, { ...t, et: e.target.value })}
                    aria-label={`Etiqueta del tramo ${i + 1}`}
                    className="mt-1 h-10 w-full rounded-lg border border-linea bg-white px-3 text-[0.9rem] focus:border-azul focus:outline-none"
                  />
                </label>

                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-[0.86rem] font-semibold">
                  <input
                    type="checkbox"
                    role="switch"
                    className="switch"
                    checked={!!t.cerrado}
                    onChange={(e) =>
                      setTramo(
                        i,
                        e.target.checked
                          ? { d: t.d, et: t.et, cerrado: true }
                          : { d: t.d, et: t.et, abre: '09:00', cierra: '20:00' },
                      )
                    }
                  />
                  Cerrado
                </label>

                {!t.cerrado && (
                  <>
                    <label>
                      <span className="block text-[0.78rem] font-semibold text-gris">Abre</span>
                      <input
                        type="time"
                        value={t.abre}
                        onChange={(e) => setTramo(i, { ...t, abre: e.target.value })}
                        aria-label={`Hora de apertura del tramo ${i + 1}`}
                        className="num mt-1 h-10 rounded-lg border border-linea bg-white px-2.5 text-[0.9rem] focus:border-azul focus:outline-none"
                      />
                    </label>
                    <label>
                      <span className="block text-[0.78rem] font-semibold text-gris">Cierra</span>
                      <input
                        type="time"
                        value={t.cierra}
                        onChange={(e) => setTramo(i, { ...t, cierra: e.target.value })}
                        aria-label={`Hora de cierre del tramo ${i + 1}`}
                        className="num mt-1 h-10 rounded-lg border border-linea bg-white px-2.5 text-[0.9rem] focus:border-azul focus:outline-none"
                      />
                    </label>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => set('horario', f.horario.filter((_, j) => j !== i))}
                  aria-label={`Eliminar tramo ${i + 1}`}
                  className="ml-auto grid size-10 place-items-center rounded-lg border border-linea bg-white text-gris hover:border-rojo hover:text-rojo"
                >
                  <Trash2 className="size-[17px]" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={`Días del tramo ${i + 1}`}>
                {DIAS.map(({ d, et }, k) => {
                  const activo = t.d.includes(d);
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={activo}
                      aria-label={`${et} (${d})`}
                      onClick={() =>
                        setTramo(i, {
                          ...t,
                          d: activo ? t.d.filter((x) => x !== d) : [...t.d, d],
                        } as Tramo)
                      }
                      className={`size-9 rounded-lg border text-[0.82rem] font-bold transition-colors ${
                        activo
                          ? 'border-transparent bg-azul text-white'
                          : 'border-linea bg-white text-gris hover:border-azul hover:text-azul'
                      }`}
                    >
                      {et}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => set('horario', [...f.horario, tramoNuevo()])}
            className="flex h-11 w-fit items-center gap-2 rounded-lg border border-linea bg-white px-3.5 text-[0.88rem] font-bold text-gris hover:border-azul hover:text-azul"
          >
            <Plus className="size-4" aria-hidden="true" /> Agregar tramo
          </button>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-rojo-borde bg-rojo-pale px-3.5 py-2.5 text-[0.88rem] font-bold text-rojo-osc">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2.5 border-t border-linea pt-4">
        <button type="submit" className="btn btn-azul">
          <Save className="size-[19px]" aria-hidden="true" /> {esNuevo ? 'Crear sucursal' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancelar} className="btn btn-borde">
          Cancelar
        </button>
      </div>
    </form>
  );
}
