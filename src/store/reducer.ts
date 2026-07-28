import type { Orden } from '../types';
import type { AppState, Cajon } from './state';
import { SUCURSALES } from '../data/sucursales';

export type Action =
  | { type: 'sucursal'; id: string }
  | { type: 'categoria'; id: string }
  | { type: 'busqueda'; q: string }
  | { type: 'soloStock'; on: boolean }
  | { type: 'orden'; orden: Orden }
  | { type: 'agregar'; id: string }
  | { type: 'cambiar'; id: string; delta: number }
  | { type: 'abrirCajon'; cajon: Exclude<Cajon, null> }
  | { type: 'cerrarCajones' };

export function reducer(estado: AppState, accion: Action): AppState {
  switch (accion.type) {
    case 'sucursal':
      if (!SUCURSALES.some((s) => s.id === accion.id)) return estado;
      return { ...estado, sucursal: accion.id };

    case 'categoria':
      return { ...estado, categoria: accion.id };

    case 'busqueda':
      return { ...estado, busqueda: accion.q };

    case 'soloStock':
      return { ...estado, soloStock: accion.on };

    case 'orden':
      return { ...estado, orden: accion.orden };

    case 'agregar': {
      const pedido = { ...estado.pedido, [accion.id]: (estado.pedido[accion.id] || 0) + 1 };
      return { ...estado, pedido };
    }

    case 'cambiar': {
      const pedido = { ...estado.pedido };
      const n = (pedido[accion.id] || 0) + accion.delta;
      if (n <= 0) delete pedido[accion.id];
      else pedido[accion.id] = n;
      return { ...estado, pedido };
    }

    case 'abrirCajon':
      return { ...estado, cajon: accion.cajon };

    case 'cerrarCajones':
      return { ...estado, cajon: null };

    default:
      return estado;
  }
}
