import { Icon, Ilu } from '../icons/Icon';
import { Sellos } from '../common/Sello';
import type { Producto } from '../../types';
import { clp } from '../../lib/format';
import { conDescuento, etStock, nivelDe, otrosLocalesCon, precioDe, stockDe } from '../../lib/stock';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';

const COLOR_NIVEL = {
  alto: 'text-ok',
  bajo: 'text-ambar',
  cero: 'text-gris-2',
} as const;

const PUNTO_NIVEL = {
  alto: 'bg-ok',
  bajo: 'bg-ambar',
  cero: 'bg-gris-2',
} as const;

/**
 * Tarjeta de producto con hover lift y micro-interacciones suaves.
 */
export function ProductCard({ p }: { p: Producto }) {
  const { estado, dispatch, anunciar } = useStore();
  const suc = useSucursalActual();

  const u = stockDe(p, suc.id);
  const precio = precioDe(p, suc.id);
  const especial = conDescuento(p, suc.id);
  const agotado = u === 0;
  const nivel = nivelDe(u);
  const enPedido = estado.pedido[p.id] || 0;

  function agregar() {
    dispatch({ type: 'agregar', id: p.id });
    anunciar(`${p.n} agregado a tu pedido.`);
  }
  function cambiar(delta: number) {
    dispatch({ type: 'cambiar', id: p.id, delta });
  }
  function verFicha() {
    dispatch({ type: 'abrirDetalle', id: p.id });
  }

  return (
    <article className="card group flex h-full flex-col p-3.5 transition-all duration-300 hover:-translate-y-1.5 hover:border-azul/30 hover:shadow-hi">
      {/* Imagen — radio concéntrico con la tarjeta */}
      <div className="relative mb-3">
        <button
          type="button"
          onClick={verFicha}
          aria-label={`Ver ficha de ${p.n}`}
          className={`grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-gradient-to-b from-fondo to-linea-2/50 p-2 transition-transform duration-300 group-hover:scale-[1.02] ${
            agotado ? 'opacity-50' : ''
          }`}
        >
          <Ilu il={p.il} className="size-[78%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
        </button>
        <Sellos p={p} />
      </div>

      <span className="text-[0.7rem] font-bold uppercase tracking-[0.06em] text-gris-2">{p.lab}</span>
      <h3 className="mt-1 text-[0.98rem] font-bold leading-[1.32] text-texto">
        <button
          type="button"
          onClick={verFicha}
          className="line-clamp-2 text-left transition-colors duration-200 hover:text-azul"
        >
          {p.n}
        </button>
      </h3>
      <p className="mt-1 text-[0.84rem] text-gris">{p.pres}</p>

      {/* Bloque inferior alineado al fondo */}
      <div className="mt-auto pt-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.78rem] font-bold ${COLOR_NIVEL[nivel]} ${
          nivel === 'alto' ? 'bg-ok-pale' : nivel === 'bajo' ? 'bg-ambar-pale' : 'bg-linea-2'
        }`}>
          <span className={`size-[6px] shrink-0 rounded-full ${PUNTO_NIVEL[nivel]}`} />
          {etStock(u)}
        </span>

        <div className="mt-2.5">
          <b className="num block text-[1.45rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-azul-osc">
            {clp(precio)}
          </b>
          {especial ? (
            <span className="text-[0.74rem] text-gris-2">
              precio en {suc.corto} · lista <s className="num">{clp(p.p)}</s>
            </span>
          ) : (
            <span className="text-[0.74rem] text-gris-2">
              {p.rec ? 'valor referencial informativo' : 'precio referencial'}
            </span>
          )}
        </div>

        {/* Acciones de pedido */}
        <div className="mt-3">
          {agotado ? (
            <div className="text-center">
              <span className="text-[0.8rem] font-bold text-gris-2">Sin stock en este local</span>
              {otrosLocalesCon(p, suc.id).length > 0 && (
                <button
                  type="button"
                  onClick={verFicha}
                  className="mt-1 block w-full text-[0.76rem] font-semibold text-azul hover:underline"
                >
                  Ver en otros locales
                </button>
              )}
            </div>
          ) : enPedido > 0 ? (
            <div className="flex items-center justify-between rounded-lg border border-azul-borde bg-azul-pale p-1">
              <button
                type="button"
                onClick={() => cambiar(-1)}
                aria-label="Disminuir cantidad"
                className="grid size-8 place-items-center rounded-md bg-white text-azul shadow-sm transition-transform active:scale-95 hover:bg-azul hover:text-white"
              >
                -
              </button>
              <span className="num text-[0.94rem] font-extrabold text-azul">{enPedido}</span>
              <button
                type="button"
                onClick={() => cambiar(1)}
                aria-label="Aumentar cantidad"
                className="grid size-8 place-items-center rounded-md bg-white text-azul shadow-sm transition-transform active:scale-95 hover:bg-azul hover:text-white"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={agregar}
              className="btn btn-azul w-full !min-h-[42px] !py-2 !text-[0.92rem] shadow-sm hover:shadow-md"
            >
              <Icon id="i-bolsa" className="size-4" />
              Reservar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
