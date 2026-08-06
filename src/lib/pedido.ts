import type { Pedido, Producto } from '../types';
import { getProductos } from '../data/repo';

export interface ItemPedido {
  p: Producto;
  c: number;
}

/**
 * Convierte el mapa {id: cantidad} en items resueltos y válidos.
 * Los ids que ya no existen en el catálogo (producto eliminado desde el
 * panel) se descartan solos.
 */
export const itemsPedido = (
  pedido: Pedido,
  productos: Producto[] = getProductos(),
): ItemPedido[] =>
  Object.entries(pedido)
    .map(([id, c]) => ({ p: productos.find((x) => x.id === id), c }))
    .filter((x): x is ItemPedido => !!x.p && x.c > 0);

/** Total referencial del pedido en CLP. */
export const totalPedido = (pedido: Pedido, productos?: Producto[]): number =>
  itemsPedido(pedido, productos).reduce((a, { p, c }) => a + p.p * c, 0);

/** Cantidad total de unidades en el pedido. */
export const cantidadPedido = (pedido: Pedido, productos?: Producto[]): number =>
  itemsPedido(pedido, productos).reduce((a, { c }) => a + c, 0);
