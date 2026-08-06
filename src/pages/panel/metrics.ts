import type { Producto, Sucursal } from '../../types';
import { CATEGORIAS } from '../../data/categorias';
import { idxSuc, nivelDe } from '../../lib/stock';
import { UMBRAL_STOCK_BAJO } from '../../config';

/* ================================================================
   MÉTRICAS DEL PANEL — cálculo puro sobre el catálogo vigente.
   Ya no hay stock simulado: todo sale de `producto.st`, que es lo que
   el panel edita y lo que la tienda muestra.
   ================================================================ */

/** Ámbito de las métricas: una sucursal o el consolidado. */
export type Scope = 'todas' | string;

/** Unidades de un producto dentro del ámbito seleccionado. */
export function unidadesEnScope(st: number[], scope: Scope, sucursales: Sucursal[]): number {
  if (scope === 'todas') return st.reduce((a, b) => a + b, 0);
  return st[idxSuc(scope, sucursales)] ?? 0;
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
export function resumen(productos: Producto[], sucursales: Sucursal[], scope: Scope): Resumen {
  let valor = 0, unidades = 0, disponibles = 0, bajos = 0, quiebres = 0;

  productos.forEach((p) => {
    const u = unidadesEnScope(p.st, scope, sucursales);
    valor += p.p * u;
    unidades += u;
    const nivel = nivelDe(u);
    if (nivel === 'alto') disponibles++;
    else if (nivel === 'bajo') bajos++;
    else quiebres++;
  });

  return { valor, unidades, skus: productos.length, disponibles, bajos, quiebres };
}

export interface FilaCategoria {
  id: string;
  et: string;
  unidades: number;
}

/** Inventario (unidades) por categoría, ordenado de mayor a menor. */
export function porCategoria(
  productos: Producto[],
  sucursales: Sucursal[],
  scope: Scope,
): FilaCategoria[] {
  return CATEGORIAS.filter((c) => c.id !== 'todos')
    .map((c) => ({
      id: c.id,
      et: c.et,
      unidades: productos
        .filter((p) => p.cat === c.id)
        .reduce((a, p) => a + unidadesEnScope(p.st, scope, sucursales), 0),
    }))
    .sort((a, b) => b.unidades - a.unidades);
}

/** Productos con quiebre o stock bajo en el ámbito, priorizados. */
export function alertas(
  productos: Producto[],
  sucursales: Sucursal[],
  scope: Scope,
): { p: Producto; u: number }[] {
  return productos
    .map((p) => ({ p, u: unidadesEnScope(p.st, scope, sucursales) }))
    .filter((x) => x.u <= UMBRAL_STOCK_BAJO)
    .sort((a, b) => a.u - b.u);
}
