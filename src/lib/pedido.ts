import type { Pedido, Producto, Sucursal } from '../types';
import { getProductos, getSucursales } from '../data/repo';
import { precioDe } from './stock';

export interface ItemPedido {
  p: Producto;
  c: number;
  /** Precio unitario que se cobra en la sucursal elegida (px[idx] ?? p). */
  precio: number;
}

/**
 * Convierte el mapa {id: cantidad} en items resueltos y válidos, con el precio
 * efectivo de la sucursal. Los ids que ya no existen en el catálogo (producto
 * eliminado desde el panel) se descartan solos.
 */
export const itemsPedido = (
  pedido: Pedido,
  sucursalId: string,
  productos: Producto[] = getProductos(),
  sucursales: Sucursal[] = getSucursales(),
): ItemPedido[] =>
  Object.entries(pedido)
    .map(([id, c]) => {
      const p = productos.find((x) => x.id === id);
      return p ? { p, c, precio: precioDe(p, sucursalId, sucursales) } : null;
    })
    .filter((x): x is ItemPedido => x !== null && x.c > 0);

/** Total referencial del pedido en CLP, con los precios de esa sucursal. */
export const totalPedido = (
  pedido: Pedido,
  sucursalId: string,
  productos?: Producto[],
  sucursales?: Sucursal[],
): number =>
  itemsPedido(pedido, sucursalId, productos, sucursales).reduce(
    (a, { precio, c }) => a + precio * c,
    0,
  );

/** Cantidad total de unidades en el pedido (no depende del precio). */
export const cantidadPedido = (pedido: Pedido, productos: Producto[] = getProductos()): number =>
  Object.entries(pedido).reduce(
    (a, [id, c]) => (productos.some((p) => p.id === id) && c > 0 ? a + c : a),
    0,
  );
