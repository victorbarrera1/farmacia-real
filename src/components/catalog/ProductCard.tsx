'use client';

import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Icon, Ilu } from '../icons/Icon';
import { Sellos } from '../common/Sello';
import type { Producto } from '../../types';
import { clp } from '../../lib/format';
import { conDescuento, etStock, nivelDe, otrosLocalesCon, precioDe, stockDe } from '../../lib/stock';
import { waLink, msgProducto } from '../../lib/whatsapp';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';

const TONO_STOCK = {
  alto: 'bg-ok-pale text-ok',
  bajo: 'bg-ambar-pale text-ambar',
  cero: 'bg-fondo text-gris-2',
} as const;

const PUNTO_STOCK = {
  alto: 'bg-ok',
  bajo: 'bg-ambar',
  cero: 'bg-gris-2',
} as const;

/**
 * Tarjeta de producto. Geometría concéntrica: tarjeta rounded-2xl (20px)
 * + p-3 (12px) → imagen rounded-md (8px). El bloque inferior usa mt-auto
 * para que la acción quede alineada entre tarjetas del mismo estante.
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
    anunciar(`${p.n} agregado a tu cotización.`);
  }
  function cambiar(delta: number) {
    dispatch({ type: 'cambiar', id: p.id, delta });
  }
  function verFicha() {
    dispatch({ type: 'abrirDetalle', id: p.id });
  }

  return (
    <article className="card flex h-full flex-col p-3 hover:border-azul-borde">
      {/* Imagen — radio concéntrico con la tarjeta (20 − 12 = 8) */}
      <div className="relative mb-2.5">
        <button
          type="button"
          onClick={verFicha}
          aria-label={`Ver ficha de ${p.n}`}
          className={`grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-fondo ${
            agotado ? 'opacity-50' : ''
          }`}
        >
          <Ilu il={p.il} className="size-[76%]" />
        </button>
        <Sellos p={p} />
      </div>

      <span
        className={`mb-1.5 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-[3px] text-[0.72rem] font-extrabold ${TONO_STOCK[nivel]}`}
      >
        <span className={`size-[6px] shrink-0 rounded-full ${PUNTO_STOCK[nivel]}`} />
        {etStock(u)}
      </span>

      <span className="text-[0.7rem] font-bold uppercase tracking-[0.06em] text-gris-2">{p.lab}</span>
      <h3 className="mt-[3px] text-[0.95rem] font-semibold leading-[1.3]">
        <button
          type="button"
          onClick={verFicha}
          className="line-clamp-2 text-left hover:text-azul hover:underline"
        >
          {p.n}
        </button>
      </h3>
      <p className="mt-[3px] text-[0.82rem] text-gris">{p.pres}</p>

      {/* Bloque inferior alineado al fondo */}
      <div className="mt-auto pt-2.5">
        <b className="num block text-[1.38rem] font-extrabold leading-[1.1] tracking-[-0.03em]">
          {clp(precio)}
        </b>
        {/* Precio propio del local: se muestra junto al de lista para que se
            entienda de dónde sale, sin lenguaje promocional. */}
        {especial ? (
          <span className="text-[0.74rem] text-gris-2">
            precio en {suc.corto} · lista <s className="num">{clp(p.p)}</s>
          </span>
        ) : (
          <span className="text-[0.74rem] text-gris-2">
            {p.rec ? 'valor referencial informativo' : 'precio referencial'}
          </span>
        )}

        <Accion
          agotado={agotado}
          receta={!!p.rec}
          enPedido={enPedido}
          onAgregar={agregar}
          onCambiar={cambiar}
          waHref={waLink(msgProducto(p, suc), suc)}
          nombre={p.n}
        />

        {p.rec && (
          <p className="mt-2 text-[0.72rem] leading-snug text-gris-2">
            Venta bajo receta médica: se valida en el local con el Químico Farmacéutico.
          </p>
        )}

        {agotado && (
          <OtrosLocales
            p={p}
            sucId={suc.id}
            onIr={(id, nombre) => {
              dispatch({ type: 'sucursal', id });
              anunciar('Cambiaste a ' + nombre);
            }}
          />
        )}
      </div>
    </article>
  );
}

function Accion({
  agotado, receta, enPedido, onAgregar, onCambiar, waHref, nombre,
}: {
  agotado: boolean;
  /** Producto con venta bajo receta: acción neutral, sin énfasis promocional. */
  receta: boolean;
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
        className="mt-2.5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-wa text-[0.94rem] font-bold text-wa-texto no-underline hover:bg-wa-osc hover:text-white"
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
        className={`mt-2.5 flex min-h-[46px] items-center justify-between overflow-hidden rounded-full border-2 ${
          receta ? 'border-azul bg-azul-pale' : 'border-rojo bg-rojo-pale'
        }`}
      >
        <button
          type="button"
          aria-label={`Quitar una unidad de ${nombre}`}
          onClick={() => onCambiar(-1)}
          className={`grid w-[46px] self-stretch place-items-center ${
            receta ? 'text-azul-osc hover:bg-azul-borde' : 'text-rojo-osc hover:bg-rojo-borde'
          }`}
        >
          <Minus className="size-[18px]" aria-hidden="true" />
        </button>
        <span className={`num text-[1rem] font-extrabold ${receta ? 'text-azul-osc' : 'text-rojo-osc'}`}>
          {enPedido}
          <span className="sr-only"> en tu cotización</span>
        </span>
        <button
          type="button"
          aria-label={`Agregar otra unidad de ${nombre}`}
          onClick={() => onCambiar(1)}
          className={`grid w-[46px] self-stretch place-items-center ${
            receta ? 'text-azul-osc hover:bg-azul-borde' : 'text-rojo-osc hover:bg-rojo-borde'
          }`}
        >
          <Plus className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    );
  }

  /* Con receta: botón neutral (sin color promocional) y texto informativo. */
  if (receta) {
    return (
      <button
        type="button"
        onClick={onAgregar}
        className="mt-2.5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border-2 border-azul bg-white text-[0.94rem] font-bold text-azul hover:bg-azul-pale"
      >
        <Plus className="size-[18px]" aria-hidden="true" /> Cotizar con receta
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onAgregar}
      className="mt-2.5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-rojo text-[0.94rem] font-bold text-white hover:bg-rojo-osc"
    >
      <ShoppingBag className="size-[17px]" aria-hidden="true" /> Cotizar
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
          <b className="mb-1.5 block text-[0.76rem] font-bold text-texto">Sí hay en:</b>
          <div className="flex flex-wrap gap-1.5">
            {disp.map((x) => (
              <button
                key={x.s.id}
                type="button"
                onClick={() => onIr(x.s.id, x.s.nombre)}
                className="inline-flex min-h-9 items-center rounded-full border border-azul-borde bg-azul-pale px-3 text-left text-[0.78rem] font-bold text-azul-osc hover:border-azul hover:bg-azul hover:text-white"
              >
                {x.s.corto || x.s.nombre}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[0.78rem] leading-snug text-gris-2">
          No queda en ninguna sucursal. Escríbenos y te lo pedimos.
        </p>
      )}
    </div>
  );
}
