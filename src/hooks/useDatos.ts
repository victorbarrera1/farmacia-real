import { useSyncExternalStore } from 'react';
import type { Producto, Sucursal } from '../types';
import {
  getProductos, getSincronizacion, getSucursales, suscribir, type Sincronizacion,
} from '../data/repo';
import { leerPedidos, suscribirPedidos, type PedidoRegistrado } from '../lib/pedidosLog';

/* Puente entre el repositorio (external store) y React: cualquier cambio
   hecho desde el panel o traído del backend repinta la tienda y el panel. */

/** Catálogo vigente (con las ediciones del panel aplicadas). */
export const useProductos = (): Producto[] =>
  useSyncExternalStore(suscribir, getProductos, getProductos);

/** Sucursales vigentes (con las ediciones del panel aplicadas). */
export const useSucursales = (): Sucursal[] =>
  useSyncExternalStore(suscribir, getSucursales, getSucursales);

/** Origen de los datos y estado de guardado contra el backend. */
export const useSincronizacion = (): Sincronizacion =>
  useSyncExternalStore(suscribir, getSincronizacion, getSincronizacion);

/** Historial de reservas enviadas por WhatsApp. */
export const usePedidosRegistrados = (): PedidoRegistrado[] =>
  useSyncExternalStore(suscribirPedidos, leerPedidos, leerPedidos);
