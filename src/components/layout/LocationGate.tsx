'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, MapPin, Store } from 'lucide-react';
import { Icon } from '../icons/Icon';
import { useStore } from '../../store/StoreContext';
import { useSucursales } from '../../hooks/useDatos';
import { marcarUbicacion, ubicacionElegida } from '../../store/state';
import { estaAbierto, textoHoy } from '../../lib/horarios';

/**
 * GATE DE UBICACIÓN — primera pantalla de la visita.
 *
 * Como el stock, el precio y el WhatsApp dependen del local, lo primero es
 * saber dónde va a retirar. Se muestra una sola vez (queda anotado en
 * localStorage) y después se cambia desde la cabecera o el pie.
 *
 * Accesible: role="dialog" + aria-modal, foco al abrir, Escape cierra
 * asumiendo la sucursal preseleccionada y el fondo queda bloqueado
 * (clase `trabado`, ver StoreContext).
 */
export function LocationGate() {
  const { estado, dispatch, anunciar } = useStore();
  const sucursales = useSucursales();
  const abierto = estado.gate;

  const comunas = useMemo(
    () => [...new Set(sucursales.map((s) => s.comuna))],
    [sucursales],
  );

  const [comuna, setComuna] = useState<string>(comunas[0] ?? '');
  const [elegida, setElegida] = useState<string>(estado.sucursal);
  const refPanel = useRef<HTMLDivElement>(null);
  const refPrimero = useRef<HTMLButtonElement>(null);

  /* Solo la primera visita: si ya eligió antes, no molestamos. */
  useEffect(() => {
    if (!ubicacionElegida()) dispatch({ type: 'abrirGate' });
  }, [dispatch]);

  /* La comuna arranca en la de la sucursal ya guardada. */
  useEffect(() => {
    const suc = sucursales.find((s) => s.id === estado.sucursal);
    if (suc) {
      setComuna(suc.comuna);
      setElegida(suc.id);
    }
  }, [sucursales, estado.sucursal]);

  useEffect(() => {
    if (!abierto) return;
    (refPrimero.current ?? refPanel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar(elegida);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [abierto, elegida]);

  if (!abierto) return null;

  const deLaComuna = sucursales.filter((s) => s.comuna === comuna);

  function cerrar(id: string) {
    const suc = sucursales.find((s) => s.id === id) ?? sucursales[0];
    dispatch({ type: 'sucursal', id: suc.id });
    marcarUbicacion();
    dispatch({ type: 'cerrarGate' });
    anunciar(`Retiras en ${suc.nombre}. Catálogo y stock de ese local.`);
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto min-[560px]:items-center min-[560px]:p-6">
      <div className="fixed inset-0 bg-azul-osc/70 backdrop-blur-[2px]" aria-hidden="true" />

      <div
        ref={refPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tGate"
        aria-describedby="dGate"
        tabIndex={-1}
        className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-t-2xl bg-white shadow-hi min-[560px]:rounded-2xl"
      >
        {/* Encabezado de marca */}
        <div className="bg-azul px-6 pb-5 pt-6 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[0.74rem] font-extrabold uppercase tracking-[0.08em]">
            <Store className="size-3.5" aria-hidden="true" /> Retiro en tienda
          </span>
          <h2 id="tGate" className="mt-3 text-white">¿En qué local vas a retirar?</h2>
          <p id="dGate" className="mt-2 text-[0.95rem] leading-snug text-white/85">
            Cada sucursal tiene su propio stock y sus propios precios. Elige una y te mostramos solo lo que hay
            ahí hoy. Puedes cambiarla cuando quieras.
          </p>
        </div>

        <div className="px-5 py-4 min-[560px]:px-6">
          {/* Comuna */}
          {comunas.length > 1 && (
            <>
              <span className="faceta-titulo block">Comuna</span>
              <div role="group" aria-label="Comuna" className="mb-4 flex flex-wrap gap-2">
                {comunas.map((c, i) => {
                  const activa = c === comuna;
                  return (
                    <button
                      key={c}
                      ref={i === 0 ? refPrimero : undefined}
                      type="button"
                      aria-pressed={activa}
                      onClick={() => {
                        setComuna(c);
                        const primera = sucursales.find((s) => s.comuna === c);
                        if (primera) setElegida(primera.id);
                      }}
                      className={`flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-[0.94rem] font-bold ${
                        activa
                          ? 'border-azul bg-azul text-white'
                          : 'border-azul-borde bg-white text-azul hover:bg-azul-pale'
                      }`}
                    >
                      <MapPin className="size-4" aria-hidden="true" /> {c}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Sucursales de esa comuna */}
          <span className="faceta-titulo block">Sucursal</span>
          <ul className="grid gap-2">
            {deLaComuna.map((s) => {
              const marcada = s.id === elegida;
              const abre = estaAbierto(s);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={marcada}
                    onClick={() => setElegida(s.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left ${
                      marcada ? 'border-azul bg-azul-pale' : 'border-linea bg-white hover:border-azul-borde hover:bg-fondo'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                        marcada ? 'border-azul bg-azul text-white' : 'border-azul-borde bg-white text-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      <Check className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[1.02rem] font-extrabold leading-tight text-azul-osc">{s.nombre}</b>
                      <span className="mt-0.5 block text-[0.87rem] leading-snug text-gris">{s.direccion}</span>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-[0.82rem] font-bold">
                        <span className={`size-[7px] rounded-full ${abre ? 'bg-ok' : 'bg-gris-2'}`} />
                        <span className={abre ? 'text-ok' : 'text-gris-2'}>{textoHoy(s)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button type="button" onClick={() => cerrar(elegida)} className="btn btn-azul btn-ancho mt-4">
            <Icon id="i-lupa" /> Ver el catálogo de este local
          </button>

          <p className="mt-3 text-center text-[0.8rem] leading-snug text-gris-2">
            Catálogo informativo con reserva por WhatsApp: no hay pago en línea ni despacho a domicilio, el pago y la
            entrega son presenciales en el local.
          </p>
        </div>
      </div>
    </div>
  );
}
