import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Inbox, Trash2 } from 'lucide-react';
import { clp } from '../../lib/format';
import { borrarHistorial, eliminarPedido, hidratarPedidos } from '../../lib/pedidosLog';
import { usePedidosRegistrados } from '../../hooks/useDatos';
import { resumenPedidos } from './analytics';

const fmtFecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });

/** Pestaña de pedidos: historial de reservas enviadas por WhatsApp. */
export function PedidosAdmin() {
  const pedidos = usePedidosRegistrados();
  const [abierto, setAbierto] = useState<string | null>(null);
  const r = useMemo(() => resumenPedidos(pedidos), [pedidos]);

  /* Con backend, el historial es el del servidor (todas las visitas). */
  useEffect(() => { hidratarPedidos().catch(() => undefined); }, []);

  return (
    <div className="flex flex-col gap-3">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[1rem] font-extrabold">Pedidos enviados</h3>
            <p className="mt-0.5 max-w-[70ch] text-[0.82rem] text-gris">
              Registro de lo que los visitantes armaron en la tienda y enviaron por WhatsApp: productos, cantidades,
              total referencial y sucursal. Sin backend, solo se ve lo enviado desde este navegador; con backend, las
              reservas de todas las visitas. No son ventas confirmadas —el cierre es en el mostrador— y no se guardan
              datos personales.
            </p>
          </div>
          {pedidos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Borrar todo el historial local de pedidos?')) borrarHistorial();
              }}
              className="flex h-11 items-center gap-2 rounded-lg border border-linea bg-white px-3.5 text-[0.88rem] font-bold text-gris transition-colors hover:border-rojo hover:text-rojo"
            >
              <Trash2 className="size-4" aria-hidden="true" /> Borrar historial
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
          {[
            { et: 'Pedidos', v: String(r.cantidad) },
            { et: 'Unidades pedidas', v: r.unidades.toLocaleString('es-CL') },
            { et: 'Valor referencial', v: clp(r.valor) },
            { et: 'Ticket promedio', v: clp(r.ticket) },
          ].map((k) => (
            <div key={k.et} className="rounded-xl border border-linea bg-fondo p-3.5">
              <div className="text-[0.78rem] font-semibold text-gris">{k.et}</div>
              <div className="num mt-1 text-[1.3rem] font-extrabold leading-none tracking-[-0.02em] text-texto">
                {k.v}
              </div>
            </div>
          ))}
        </div>
      </section>

      {!pedidos.length ? (
        <section className="card px-5 py-14 text-center">
          <Inbox className="mx-auto mb-3 size-12 text-azul-borde" aria-hidden="true" />
          <b className="block text-[1.05rem] font-extrabold">Todavía no hay pedidos registrados</b>
          <p className="mx-auto mt-1.5 max-w-[52ch] text-[0.92rem] text-gris">
            Arma un pedido en la tienda y envíalo por WhatsApp: quedará registrado acá con productos, cantidades,
            total y sucursal.
          </p>
        </section>
      ) : (
        <section className="card overflow-hidden">
          <ul>
            {pedidos.map((o) => {
              const expandido = abierto === o.id;
              return (
                <li key={o.id} className="border-b border-linea-2 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <button
                      type="button"
                      aria-expanded={expandido}
                      onClick={() => setAbierto(expandido ? null : o.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <ChevronDown
                        className={`size-[18px] shrink-0 text-gris transition-transform ${expandido ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-[0.9rem] font-bold text-texto">
                          {o.items.length} {o.items.length === 1 ? 'producto' : 'productos'} · {o.unidades} u.
                        </span>
                        <span className="block truncate text-[0.79rem] text-gris-2">
                          {fmtFecha(o.fecha)} · retiro en {o.sucursalNombre}
                        </span>
                      </span>
                    </button>

                    <span className="num shrink-0 text-[1rem] font-extrabold tabular-nums">{clp(o.total)}</span>
                    <button
                      type="button"
                      onClick={() => eliminarPedido(o.id)}
                      aria-label="Eliminar este pedido del historial"
                      className="grid size-10 shrink-0 place-items-center rounded-lg border border-linea text-gris hover:border-rojo hover:text-rojo"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  {expandido && (
                    <ul className="bg-fondo px-5 py-3">
                      {o.items.map((l, i) => (
                        <li
                          key={`${l.id}-${i}`}
                          className="flex items-center gap-3 border-b border-linea-2 py-2 text-[0.87rem] last:border-b-0"
                        >
                          <span className="num w-10 shrink-0 font-bold text-azul">{l.c}×</span>
                          <span className="min-w-0 flex-1">
                            <b className="font-semibold text-texto">{l.n}</b>
                            <span className="text-gris-2"> · {l.pres} · {l.lab}</span>
                          </span>
                          <span className="num shrink-0 font-bold tabular-nums">{clp(l.p * l.c)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
