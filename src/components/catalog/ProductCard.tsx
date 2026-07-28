import { Icon, Ilu } from '../icons/Icon';
import { Sellos } from '../common/Sello';
import type { Producto } from '../../types';
import { clp } from '../../lib/format';
import { nivelDe, etStock, stockDe, otrosLocalesCon } from '../../lib/stock';
import { waLink, msgProducto } from '../../lib/whatsapp';
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
 * Tarjeta de producto. Geometría armonizada:
 * tarjeta rounded-2xl (20px) + p-3 (12px) → imagen rounded-md (8px), concéntrica.
 * El bloque inferior usa mt-auto para que la acción quede alineada entre tarjetas.
 */
export function ProductCard({ p }: { p: Producto }) {
  const { estado, dispatch, anunciar } = useStore();
  const suc = useSucursalActual();

  const u = stockDe(p, suc.id);
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

  return (
    <article className="card flex h-full flex-col p-3 transition-[box-shadow,border-color] hover:border-azul-borde hover:shadow-hi">
      {/* Imagen — radio concéntrico con la tarjeta (20 − 12 = 8) */}
      <div
        className={`relative mb-[11px] grid aspect-square place-items-center overflow-hidden rounded-md bg-fondo ${
          agotado ? 'opacity-50' : ''
        }`}
      >
        <Ilu il={p.il} className="size-[74%]" />
        <Sellos p={p} />
      </div>

      <span className="text-[0.7rem] font-bold uppercase tracking-[0.06em] text-gris-2">{p.lab}</span>
      <h3 className="mt-[3px] line-clamp-2 text-[0.98rem] font-semibold leading-[1.32]">{p.n}</h3>
      <p className="mt-[3px] text-[0.84rem] text-gris">{p.pres}</p>

      {/* Bloque inferior alineado al fondo */}
      <div className="mt-auto">
        <span className={`mt-[9px] inline-flex items-center gap-1.5 text-[0.82rem] font-bold ${COLOR_NIVEL[nivel]}`}>
          <span className={`size-[7px] shrink-0 rounded-full ${PUNTO_NIVEL[nivel]}`} />
          {etStock(u)}
        </span>

        <div className="mt-[9px]">
          <b className="num block text-[1.42rem] font-extrabold leading-[1.1] tracking-[-0.03em]">{clp(p.p)}</b>
          <span className="text-[0.74rem] text-gris-2">precio referencial</span>
        </div>

        <Accion agotado={agotado} enPedido={enPedido} onAgregar={agregar} onCambiar={cambiar} waHref={waLink(msgProducto(p, suc), suc)} nombre={p.n} />

        {agotado && <OtrosLocales p={p} sucId={suc.id} onIr={(id, nombre) => { dispatch({ type: 'sucursal', id }); anunciar('Cambiaste a ' + nombre); }} />}
      </div>
    </article>
  );
}

function Accion({
  agotado, enPedido, onAgregar, onCambiar, waHref, nombre,
}: {
  agotado: boolean;
  enPedido: number;
  onAgregar: () => void;
  onCambiar: (delta: number) => void;
  waHref: string;
  nombre: string;
}) {
  if (agotado) {
    return (
      <a
        href={waHref}
        target="_blank"
        rel="noopener"
        className="mt-[11px] flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-wa text-[0.95rem] font-bold text-wa-texto no-underline transition-colors hover:bg-wa-osc hover:text-white"
      >
        <Icon id="i-wa" className="size-[18px]" /> Consultar
      </a>
    );
  }

  if (enPedido > 0) {
    return (
      <div
        role="group"
        aria-label={`Cantidad de ${nombre}`}
        className="mt-[11px] flex min-h-[46px] items-center justify-between overflow-hidden rounded-lg border-2 border-rojo bg-rojo-pale"
      >
        <button
          type="button"
          aria-label={`Quitar una unidad de ${nombre}`}
          onClick={() => onCambiar(-1)}
          className="grid w-[46px] self-stretch place-items-center text-[1.35rem] font-bold leading-none text-rojo-osc hover:bg-rojo-borde"
        >
          −
        </button>
        <span className="num text-[1rem] font-extrabold text-rojo-osc">{enPedido} en tu pedido</span>
        <button
          type="button"
          aria-label={`Agregar otra unidad de ${nombre}`}
          onClick={() => onCambiar(1)}
          className="grid w-[46px] self-stretch place-items-center text-[1.35rem] font-bold leading-none text-rojo-osc hover:bg-rojo-borde"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAgregar}
      className="mt-[11px] flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-rojo text-[0.95rem] font-bold text-white transition-colors hover:bg-rojo-osc"
    >
      <Icon id="i-mas" className="size-[18px]" /> Agregar
    </button>
  );
}

function OtrosLocales({
  p, sucId, onIr,
}: {
  p: Producto;
  sucId: string;
  onIr: (id: string, nombre: string) => void;
}) {
  const disp = otrosLocalesCon(p, sucId);

  return (
    <div className="mt-2.5 border-t border-dashed border-linea pt-2.5">
      {disp.length ? (
        <>
          <b className="mb-1.5 block text-[0.78rem] font-bold text-texto">Sí hay en:</b>
          <div className="flex flex-wrap gap-1.5">
            {disp.map((x) => (
              <button
                key={x.s.id}
                type="button"
                onClick={() => onIr(x.s.id, x.s.nombre)}
                className="inline-flex min-h-11 items-center rounded-full border border-azul-borde bg-azul-pale px-3.5 py-[5px] text-left text-[0.8rem] font-bold text-azul-osc transition-colors hover:border-azul hover:bg-azul hover:text-white"
              >
                {x.s.corto || x.s.nombre}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[0.79rem] leading-snug text-gris-2">
          No queda en ninguna sucursal. Escríbenos y te lo pedimos.
        </p>
      )}
    </div>
  );
}
