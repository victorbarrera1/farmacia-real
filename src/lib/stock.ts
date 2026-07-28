import type { NivelStock, Producto, Sucursal } from '../types';
import { SUCURSALES } from '../data/sucursales';

/** Índice de la sucursal dentro de SUCURSALES (para leer p.st[i]). */
export const idxSuc = (sucId: string): number =>
  Math.max(0, SUCURSALES.findIndex((s) => s.id === sucId));

/** Unidades del producto en la sucursal indicada. */
export const stockDe = (p: Producto, sucId: string): number => p.st[idxSuc(sucId)] ?? 0;

/** Nivel de stock: alto (>8), bajo (1–8), cero. */
export const nivelDe = (u: number): NivelStock => (u === 0 ? 'cero' : u <= 8 ? 'bajo' : 'alto');

/** Etiqueta legible del stock. */
export const etStock = (u: number): string =>
  u === 0 ? 'Sin stock hoy' : u <= 8 ? 'Quedan ' + u : 'Disponible';

/** Otras sucursales (≠ actual) donde sí queda el producto. */
export const otrosLocalesCon = (p: Producto, sucId: string): { s: Sucursal; u: number }[] =>
  SUCURSALES
    .map((s, i) => ({ s, u: p.st[i] ?? 0 }))
    .filter((x) => x.u > 0 && x.s.id !== sucId);
