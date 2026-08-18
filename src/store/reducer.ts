import type { Orden, RangoPrecio } from '../types';
import type { AppState, Cajon } from './state';
import { getSucursales } from '../data/repo';

export type Action =
  | { type: 'sucursal'; id: string }
  | { type: 'categoria'; id: string }
  | { type: 'busqueda'; q: string }
  | { type: 'soloStock'; on: boolean }
  | { type: 'orden'; orden: Orden }
  | { type: 'lab'; lab: string }
  | { type: 'soloBio'; on: boolean }
  | { type: 'sinReceta'; on: boolean }
  | { type: 'precio'; rango: RangoPrecio }
  | { type: 'limpiarFiltros' }
  | { type: 'agregar'; id: string }
  | { type: 'cambiar'; id: string; delta: number }
  | { type: 'vaciarPedido' }
  | { type: 'abrirCajon'; cajon: Exclude<Cajon, null> }
  | { type: 'cerrarCajones' }
  | { type: 'abrirDetalle'; id: string }
  | { type: 'cerrarDetalle' }
  | { type: 'abrirLegal' }
  | { type: 'cerrarLegal' }
  | { type: 'abrirGate' }
  | { type: 'cerrarGate' };

export function reducer(estado: AppState, accion: Action): AppState {
  switch (accion.type) {
    case 'sucursal':
      if (!getSucursales().some((s) => s.id === accion.id)) return estado;
      /* Los laboratorios marcados pueden no existir en el otro local: se
         limpian para no dejar el catálogo vacío sin explicación. */
      return { ...estado, sucursal: accion.id, labs: [] };

    case 'categoria':
      return { ...estado, categoria: accion.id };

    case 'busqueda':
      return { ...estado, busqueda: accion.q };

    case 'soloStock':
      return { ...estado, soloStock: accion.on };

    case 'orden':
      return { ...estado, orden: accion.orden };

    case 'lab': {
      const labs = estado.labs.includes(accion.lab)
        ? estado.labs.filter((l) => l !== accion.lab)
        : [...estado.labs, accion.lab];
      return { ...estado, labs };
    }

    case 'soloBio':
      return { ...estado, soloBio: accion.on };

    case 'sinReceta':
      return { ...estado, sinReceta: accion.on };

    case 'precio':
      return { ...estado, precio: accion.rango };

    case 'limpiarFiltros':
      return { ...estado, labs: [], soloBio: false, sinReceta: false, precio: 'todos', soloStock: false };

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

    case 'vaciarPedido':
      return { ...estado, pedido: {} };

    case 'abrirCajon':
      return { ...estado, cajon: accion.cajon, detalle: null };

    case 'cerrarCajones':
      return { ...estado, cajon: null };

    case 'abrirDetalle':
      return { ...estado, detalle: accion.id, cajon: null };

    case 'cerrarDetalle':
      return { ...estado, detalle: null };

    case 'abrirLegal':
      return { ...estado, legal: true };

    case 'cerrarLegal':
      return { ...estado, legal: false };

    case 'abrirGate':
      return { ...estado, gate: true, cajon: null, detalle: null };

    case 'cerrarGate':
      return { ...estado, gate: false };

    default:
      return estado;
  }
}
