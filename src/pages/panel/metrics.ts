import type { Producto } from '../../types';
import { PRODUCTOS } from '../../data/productos';
import { CATEGORIAS } from '../../data/categorias';
import { SUCURSALES } from '../../data/sucursales';
import { idxSuc, nivelDe } from '../../lib/stock';

/** Stock simulado: id de producto → unidades por sucursal. */
export type StockMap = Record<string, number[]>;

/** Ámbito de las métricas: una sucursal o el consolidado. */
export type Scope = 'todas' | string;

/** Semilla del stock simulado a partir del catálogo. */
export const stockSemilla = (): StockMap =>
  Object.fromEntries(PRODUCTOS.map((p) => [p.id, [...p.st]]));

/** Unidades de un producto dentro del ámbito seleccionado. */
export function unidadesEnScope(st: number[], scope: Scope): number {
  if (scope === 'todas') return st.reduce((a, b) => a + b, 0);
  return st[idxSuc(scope)] ?? 0;
}

export interface Resumen {
  valor: number;
  unidades: number;
  skus: number;
  disponibles: number;
  bajos: number;
  quiebres: number;
}

/** KPIs del inventario para el ámbito dado. */
export function resumen(stock: StockMap, scope: Scope): Resumen {
  let valor = 0, unidades = 0, disponibles = 0, bajos = 0, quiebres = 0;

  PRODUCTOS.forEach((p) => {
    const u = unidadesEnScope(stock[p.id] ?? p.st, scope);
    valor += p.p * u;
    unidades += u;
    const nivel = nivelDe(u);
    if (nivel === 'alto') disponibles++;
    else if (nivel === 'bajo') bajos++;
    else quiebres++;
  });

  return { valor, unidades, skus: PRODUCTOS.length, disponibles, bajos, quiebres };
}

export interface FilaCategoria {
  id: string;
  et: string;
  unidades: number;
}

/** Inventario (unidades) por categoría, ordenado de mayor a menor. */
export function porCategoria(stock: StockMap, scope: Scope): FilaCategoria[] {
  return CATEGORIAS.filter((c) => c.id !== 'todos')
    .map((c) => ({
      id: c.id,
      et: c.et,
      unidades: PRODUCTOS.filter((p) => p.cat === c.id).reduce(
        (a, p) => a + unidadesEnScope(stock[p.id] ?? p.st, scope),
        0,
      ),
    }))
    .sort((a, b) => b.unidades - a.unidades);
}

/** Productos con quiebre o stock bajo en el ámbito, priorizados. */
export function alertas(stock: StockMap, scope: Scope): { p: Producto; u: number }[] {
  return PRODUCTOS.map((p) => ({ p, u: unidadesEnScope(stock[p.id] ?? p.st, scope) }))
    .filter((x) => x.u <= 8)
    .sort((a, b) => a.u - b.u);
}

/** Sucursal por su id (para etiquetas de columnas). */
export const nombreSucursal = (id: string) =>
  SUCURSALES.find((s) => s.id === id)?.corto ?? id;
