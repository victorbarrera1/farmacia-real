import type { Pedido, Producto } from '../types';
import { PRODUCTOS } from '../data/productos';

export interface ItemPedido {
  p: Producto;
  c: number;
}

/** Convierte el mapa {id: cantidad} en items resueltos y válidos. */
export const itemsPedido = (pedido: Pedido): ItemPedido[] =>
  Object.entries(pedido)
    .map(([id, c]) => ({ p: PRODUCTOS.find((x) => x.id === id), c }))
    .filter((x): x is ItemPedido => !!x.p && x.c > 0);

/** Total referencial del pedido en CLP. */
export const totalPedido = (pedido: Pedido): number =>
  itemsPedido(pedido).reduce((a, { p, c }) => a + p.p * c, 0);

/** Cantidad total de unidades en el pedido. */
export const cantidadPedido = (pedido: Pedido): number =>
  itemsPedido(pedido).reduce((a, { c }) => a + c, 0);
