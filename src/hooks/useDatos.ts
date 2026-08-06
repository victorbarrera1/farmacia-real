import { useSyncExternalStore } from 'react';
import type { Producto, Sucursal } from '../types';
import { getProductos, getSucursales, suscribir } from '../data/repo';
import { leerPedidos, suscribirPedidos, type PedidoRegistrado } from '../lib/pedidosLog';

/* Puente entre el repositorio (external store) y React: cualquier cambio
   hecho desde el panel repinta la tienda y el panel sin recargar. */

/** Catálogo vigente (con las ediciones del panel aplicadas). */
export const useProductos = (): Producto[] =>
  useSyncExternalStore(suscribir, getProductos, getProductos);

/** Sucursales vigentes (con las ediciones del panel aplicadas). */
export const useSucursales = (): Sucursal[] =>
  useSyncExternalStore(suscribir, getSucursales, getSucursales);

/** Historial local de pedidos enviados por WhatsApp. */
export const usePedidosRegistrados = (): PedidoRegistrado[] =>
  useSyncExternalStore(suscribirPedidos, leerPedidos, leerPedidos);
