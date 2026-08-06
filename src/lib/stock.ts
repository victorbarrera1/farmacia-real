import type { NivelStock, Producto, Sucursal } from '../types';
import { getSucursales } from '../data/repo';
import { precioEnPos, tienePrecioEspecial, visibleEnPos } from './dominio';
import { UMBRAL_STOCK_BAJO } from '../config';

/* Las funciones aceptan la lista de sucursales como parámetro (siguen siendo
   puras y testeables) y por defecto usan la vigente en el repositorio. */

/** Índice de la sucursal dentro de la lista (para leer `p.st[i]`). */
export const idxSuc = (sucId: string, sucursales: Sucursal[] = getSucursales()): number => {
  const i = sucursales.findIndex((s) => s.id === sucId);
  return i < 0 ? 0 : i;
};

/** Unidades del producto en la sucursal indicada. */
export const stockDe = (p: Producto, sucId: string, sucursales?: Sucursal[]): number =>
  p.st[idxSuc(sucId, sucursales)] ?? 0;

/**
 * PRECIO que se cobra en esa sucursal: el precio especial del local si existe,
 * o el global. Toda la app (tarjeta, ficha, pedido, WhatsApp, panel) pasa por
 * acá para no mostrar dos precios distintos del mismo producto.
 */
export const precioDe = (p: Producto, sucId: string, sucursales?: Sucursal[]): number =>
  precioEnPos(p, idxSuc(sucId, sucursales));

/** ¿El producto se muestra en la tienda de esa sucursal? */
export const visibleEn = (p: Producto, sucId: string, sucursales?: Sucursal[]): boolean =>
  visibleEnPos(p, idxSuc(sucId, sucursales));

/** ¿El precio de esa sucursal es especial (distinto del global)? */
export const conDescuento = (p: Producto, sucId: string, sucursales?: Sucursal[]): boolean =>
  tienePrecioEspecial(p, idxSuc(sucId, sucursales));

/** Nivel de stock: alto (> umbral), bajo (1–umbral), cero. */
export const nivelDe = (u: number): NivelStock =>
  u === 0 ? 'cero' : u <= UMBRAL_STOCK_BAJO ? 'bajo' : 'alto';

/** Etiqueta legible del stock. */
export const etStock = (u: number): string =>
  u === 0 ? 'Sin stock hoy' : u <= UMBRAL_STOCK_BAJO ? 'Quedan ' + u : 'Disponible';

/** Otras sucursales (≠ actual) donde sí queda el producto y está a la venta. */
export const otrosLocalesCon = (
  p: Producto,
  sucId: string,
  sucursales: Sucursal[] = getSucursales(),
): { s: Sucursal; u: number }[] =>
  sucursales
    .map((s, i) => ({ s, u: p.st[i] ?? 0, visible: visibleEnPos(p, i) }))
    .filter((x) => x.u > 0 && x.visible && x.s.id !== sucId)
    .map(({ s, u }) => ({ s, u }));
