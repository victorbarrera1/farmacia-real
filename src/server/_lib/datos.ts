import type { Producto, Sucursal } from '../../types.ts';
import {
  type Catalogo, alinearStock, sanearCatalogo, sanearProductos, sanearSucursales,
} from '../../lib/dominio.ts';
import { PRODUCTOS } from '../../data/productos.ts';
import { SUCURSALES } from '../../data/sucursales.ts';
import type { Almacen } from './almacen.ts';

/* ================================================================
   DATOS DEL SERVIDOR
   ----------------------------------------------------------------
   Fuente de verdad en el almacén; si está vacío, se siembra con los
   datos de fábrica de `src/data/*`. El CRUD real vive en
   `src/lib/dominio.ts` (puro y compartido con el navegador), acá solo
   está la lectura/escritura y el historial de pedidos.
   ================================================================ */

const CLAVE_CATALOGO = 'catalogo';
const CLAVE_PEDIDOS = 'pedidos';
/** Tope del historial de pedidos guardado. */
const TOPE_PEDIDOS = 500;

/** Catálogo de fábrica (el del repositorio), ya alineado. */
export function catalogoDeFabrica(): Catalogo {
  return {
    sucursales: sanearSucursales(SUCURSALES),
    productos: alinearStock(sanearProductos(PRODUCTOS), SUCURSALES.length),
    version: 0,
  };
}

/** Lee el catálogo vigente. Sin almacén devuelve el de fábrica. */
export async function leerCatalogo(a: Almacen | null): Promise<Catalogo> {
  const fabrica = catalogoDeFabrica();
  if (!a) return fabrica;
  const guardado = await a.leer<unknown>(CLAVE_CATALOGO);
  if (!guardado) return fabrica;
  return sanearCatalogo(guardado, fabrica);
}

/** Persiste el catálogo (saneado) y lo devuelve tal como quedó. */
export async function escribirCatalogo(a: Almacen, c: Catalogo): Promise<Catalogo> {
  const limpio = sanearCatalogo(c, catalogoDeFabrica());
  await a.escribir(CLAVE_CATALOGO, limpio);
  return limpio;
}

/** Vuelve el catálogo a los datos de fábrica del repositorio. */
export async function restaurarTodo(a: Almacen): Promise<Catalogo> {
  const fabrica = { ...catalogoDeFabrica(), version: Date.now() };
  await a.escribir(CLAVE_CATALOGO, fabrica);
  return fabrica;
}

/** Restaura solo los productos, conservando las sucursales vigentes. */
export async function restaurarProductos(a: Almacen): Promise<Catalogo> {
  const actual = await leerCatalogo(a);
  const fabrica = catalogoDeFabrica();
  return escribirCatalogo(a, {
    sucursales: actual.sucursales,
    productos: alinearStock(fabrica.productos, actual.sucursales.length),
    version: Date.now(),
  });
}

/** Restaura solo las sucursales, reindexando el stock de los productos. */
export async function restaurarSucursales(a: Almacen): Promise<Catalogo> {
  const actual = await leerCatalogo(a);
  const fabrica = catalogoDeFabrica();
  const productos = actual.productos.map((p) => ({
    ...p,
    st: fabrica.sucursales.map((s) => {
      const i = actual.sucursales.findIndex((x) => x.id === s.id);
      return i >= 0 ? p.st[i] ?? 0 : 0;
    }),
  }));
  return escribirCatalogo(a, { sucursales: fabrica.sucursales, productos, version: Date.now() });
}

/* --------------------------- pedidos --------------------------- */

export interface LineaPedido {
  id: string;
  n: string;
  pres: string;
  lab: string;
  p: number;
  c: number;
}

export interface PedidoRegistrado {
  id: string;
  fecha: string;
  sucursalId: string;
  sucursalNombre: string;
  total: number;
  unidades: number;
  items: LineaPedido[];
}

const texto = (v: unknown, max = 120): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const numero = (v: unknown, max = 100_000_000): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.trunc(n))) : 0;
};

/** Sanea un pedido que llega desde la tienda (entrada no confiable). */
export function sanearPedido(v: unknown): PedidoRegistrado | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const items = Array.isArray(o.items)
    ? o.items
        .slice(0, 100)
        .map((x) => {
          const l = (x ?? {}) as Record<string, unknown>;
          const n = texto(l.n);
          if (!n) return null;
          return {
            id: texto(l.id, 48),
            n,
            pres: texto(l.pres, 80),
            lab: texto(l.lab, 80),
            p: numero(l.p),
            c: Math.max(1, numero(l.c, 9999)),
          } satisfies LineaPedido;
        })
        .filter((l): l is LineaPedido => l !== null)
    : [];
  if (!items.length) return null;

  const fecha = texto(o.fecha, 30);
  return {
    id: texto(o.id, 40) || `o-${Date.now().toString(36)}`,
    fecha: Number.isFinite(Date.parse(fecha)) ? new Date(fecha).toISOString() : new Date().toISOString(),
    sucursalId: texto(o.sucursalId, 32),
    sucursalNombre: texto(o.sucursalNombre, 80) || '—',
    total: numero(o.total) || items.reduce((acc, l) => acc + l.p * l.c, 0),
    unidades: numero(o.unidades) || items.reduce((acc, l) => acc + l.c, 0),
    items,
  };
}

export async function leerPedidos(a: Almacen | null): Promise<PedidoRegistrado[]> {
  if (!a) return [];
  const g = await a.leer<unknown[]>(CLAVE_PEDIDOS);
  if (!Array.isArray(g)) return [];
  return g.map(sanearPedido).filter((p): p is PedidoRegistrado => p !== null);
}

export async function agregarPedido(
  a: Almacen,
  entrada: unknown,
): Promise<PedidoRegistrado | null> {
  const pedido = sanearPedido(entrada);
  if (!pedido) return null;
  const actuales = await leerPedidos(a);
  /* Idempotencia básica: si el id ya existe, no lo duplicamos. */
  if (actuales.some((p) => p.id === pedido.id)) return pedido;
  await a.escribir(CLAVE_PEDIDOS, [pedido, ...actuales].slice(0, TOPE_PEDIDOS));
  return pedido;
}

export async function eliminarPedido(a: Almacen, id: string): Promise<void> {
  const actuales = await leerPedidos(a);
  await a.escribir(CLAVE_PEDIDOS, actuales.filter((p) => p.id !== texto(id, 40)));
}

export async function borrarPedidos(a: Almacen): Promise<void> {
  await a.escribir(CLAVE_PEDIDOS, []);
}

/* Reexportamos los tipos del dominio que usan los handlers. */
export type { Catalogo, Producto, Sucursal };
