import { useEffect, useRef } from 'react';
import { Icon, Ilu } from '../icons/Icon';
import { Sellos } from '../common/Sello';
import { clp } from '../../lib/format';
import { conDescuento, etStock, nivelDe, precioDe, stockDe } from '../../lib/stock';
import { msgProducto, waLink } from '../../lib/whatsapp';
import { useStore } from '../../store/StoreContext';
import { useProductos, useSucursales } from '../../hooks/useDatos';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { PoliciesLink } from '../legal/Policies';

const TONO = {
  alto: 'bg-ok-pale text-ok',
  bajo: 'bg-ambar-pale text-ambar',
  cero: 'bg-fondo text-gris-2',
} as const;

/**
 * Ficha de detalle del producto (modal). Muestra descripción, precio,
 * el stock de todas las sucursales y las acciones de pedido/consulta.
 * Se abre desde la tarjeta del catálogo (estado.detalle en el store).
 */
export function ProductModal() {
  const { estado, dispatch, anunciar } = useStore();
  const productos = useProductos();
  const sucursales = useSucursales();
  const suc = useSucursalActual();
  const refCerrar = useRef<HTMLButtonElement>(null);

  const p = productos.find((x) => x.id === estado.detalle) ?? null;
  const abierto = p !== null;

  useEffect(() => {
    if (!abierto) return;
    refCerrar.current?.focus();
    /* Capa superior: Escape cierra solo esta ficha (ver Policies.tsx). */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      dispatch({ type: 'cerrarDetalle' });
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [abierto, dispatch]);

  if (!p) return null;

  const u = stockDe(p, suc.id, sucursales);
  const precio = precioDe(p, suc.id, sucursales);
  const especial = conDescuento(p, suc.id, sucursales);
  const agotado = u === 0;
  const enPedido = estado.pedido[p.id] || 0;
  const cerrar = () => dispatch({ type: 'cerrarDetalle' });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-0 min-[720px]:items-center min-[720px]:p-6">
      <div
        className="fixed inset-0 bg-azul-osc/55"
        onClick={cerrar}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tDetalle"
        className="relative z-10 max-h-[90dvh] w-full max-w-[860px] overflow-y-auto overscroll-contain rounded-t-2xl border border-linea bg-white shadow-hi pb-[env(safe-area-inset-bottom,0px)] min-[720px]:max-h-[88vh] min-[720px]:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-linea bg-white px-5 py-3.5">
          <b className="mr-auto text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-gris-2">
            Ficha del producto
          </b>
          <button
            ref={refCerrar}
            type="button"
            aria-label="Cerrar ficha del producto"
            onClick={cerrar}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-fondo text-gris hover:bg-linea hover:text-texto"
          >
            <Icon id="i-x" className="size-[17px]" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 min-[720px]:grid-cols-[300px_1fr]">
          <div>
            <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-fondo">
              <Ilu il={p.il} className="size-[70%]" />
              <Sellos p={p} />
            </div>
          </div>

          <div className="min-w-0">
            <span className="text-[0.74rem] font-bold uppercase tracking-[0.06em] text-gris-2">{p.lab}</span>
            <h2 id="tDetalle" className="mt-1">{p.n}</h2>
            <p className="mt-1.5 text-[0.95rem] text-gris">
              {p.pres} · principio activo: <b className="font-semibold text-texto">{p.act}</b>
            </p>

            <p className="mt-3 max-w-[60ch] text-[0.94rem] leading-relaxed text-gris">
              {p.desc ??
                `${p.n} de ${p.lab}, presentación ${p.pres}. Precio referencial: el valor final y la disponibilidad se confirman por WhatsApp antes de tu retiro en la sucursal.`}
            </p>

            {p.rec && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-rojo-borde bg-rojo-pale px-3.5 py-2.5 text-[0.87rem] leading-snug text-rojo-osc">
                <Icon id="i-alerta" className="mt-px size-[17px] shrink-0" />
                <span>
                  <b className="font-extrabold">Venta bajo receta médica.</b> La entrega queda condicionada a la
                  presentación y verificación presencial de la receta (física o electrónica) por el Químico
                  Farmacéutico de turno. La información de este producto es informativa y no constituye publicidad.
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-linea pt-4">
              <div>
                <b className="num block text-[1.9rem] font-extrabold leading-none tracking-[-0.03em]">
                  {clp(precio)}
                </b>
                <span className="text-[0.78rem] text-gris-2">
                  {especial && `precio en ${suc.corto} · lista ${clp(p.p)} · `}
                  {p.rec ? 'valor referencial informativo · se confirma en caja' : 'precio referencial'}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.85rem] font-bold ${TONO[nivelDe(u)]}`}
              >
                {etStock(u)} en {suc.corto}
              </span>
            </div>

            {/* Acciones */}
            <div className="mt-4 flex flex-wrap gap-2.5">
              {agotado ? (
                <a
                  href={waLink(msgProducto(p, suc), suc)}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-wa flex-auto"
                >
                  <Icon id="i-wa" /> Consultar por WhatsApp
                </a>
              ) : enPedido > 0 ? (
                <div
                  role="group"
                  aria-label={`Cantidad de ${p.n}`}
                  className={`flex min-h-[50px] flex-auto items-center justify-between overflow-hidden rounded-full border-2 ${
                    p.rec ? 'border-azul bg-azul-pale' : 'border-rojo bg-rojo-pale'
                  }`}
                >
                  <button
                    type="button"
                    aria-label={`Quitar una unidad de ${p.n}`}
                    onClick={() => dispatch({ type: 'cambiar', id: p.id, delta: -1 })}
                    className={`grid w-[50px] self-stretch place-items-center text-[1.4rem] font-bold leading-none ${
                      p.rec ? 'text-azul-osc hover:bg-azul-borde' : 'text-rojo-osc hover:bg-rojo-borde'
                    }`}
                  >
                    −
                  </button>
                  <span className={`num text-[1rem] font-extrabold ${p.rec ? 'text-azul-osc' : 'text-rojo-osc'}`}>
                    {enPedido} en tu cotización
                  </span>
                  <button
                    type="button"
                    aria-label={`Agregar otra unidad de ${p.n}`}
                    onClick={() => dispatch({ type: 'cambiar', id: p.id, delta: 1 })}
                    className={`grid w-[50px] self-stretch place-items-center text-[1.4rem] font-bold leading-none ${
                      p.rec ? 'text-azul-osc hover:bg-azul-borde' : 'text-rojo-osc hover:bg-rojo-borde'
                    }`}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'agregar', id: p.id });
                    anunciar(`${p.n} agregado a tu cotización.`);
                  }}
                  className={
                    p.rec
                      ? 'btn btn-borde flex-auto border-azul text-azul hover:bg-azul-pale'
                      : 'btn flex-auto bg-rojo text-white hover:bg-rojo-osc'
                  }
                >
                  <Icon id="i-mas" /> {p.rec ? 'Cotizar con receta' : 'Agregar a cotización'}
                </button>
              )}
              <button type="button" onClick={cerrar} className="btn btn-borde">
                Seguir mirando
              </button>
            </div>

            <p className="mt-3 text-[0.8rem] leading-relaxed text-gris-2">
              La cotización no es una compra en línea: confirma disponibilidad y el pago se realiza presencialmente en
              caja al retirar.{' '}
              <PoliciesLink className="font-bold text-azul underline hover:text-azul-osc">
                Ver condiciones del catálogo
              </PoliciesLink>
            </p>

            {/* Stock en todas las sucursales */}
            <div className="mt-5">
              <b className="block text-[0.88rem] font-extrabold text-texto">Stock por sucursal</b>
              <ul className="mt-2">
                {sucursales.map((s, i) => {
                  const un = p.st[i] ?? 0;
                  const actual = s.id === suc.id;
                  const px = p.px[i];
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 border-b border-linea-2 py-2.5 text-[0.9rem] last:border-b-0"
                    >
                      <Icon id="i-pin" className="size-4 shrink-0 text-azul" />
                      <span className="min-w-0 flex-1 truncate">
                        {s.corto}
                        {actual && <span className="ml-1.5 font-bold text-azul">· elegida</span>}
                        {px !== null && px !== p.p && (
                          <span className="num ml-1.5 text-gris-2">{clp(px)}</span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[0.78rem] font-bold ${
                          p.vis[i] === false ? 'bg-fondo text-gris-2' : TONO[nivelDe(un)]
                        }`}
                      >
                        {p.vis[i] === false ? 'No lo maneja' : etStock(un)}
                      </span>
                      {!actual && un > 0 && p.vis[i] !== false && (
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: 'sucursal', id: s.id });
                            anunciar(`Cambiaste a ${s.nombre}`);
                          }}
                          className="shrink-0 text-[0.82rem] font-bold text-azul hover:underline"
                        >
                          Retirar acá
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
