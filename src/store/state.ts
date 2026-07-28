import type { Orden, Pedido } from '../types';
import { SUCURSALES } from '../data/sucursales';
import { PRODUCTOS } from '../data/productos';

/** Cajón (drawer) actualmente abierto, si hay alguno. */
export type Cajon = 'pedido' | 'suc' | null;

export interface AppState {
  sucursal: string;
  categoria: string;
  busqueda: string;
  soloStock: boolean;
  orden: Orden;
  pedido: Pedido;
  cajon: Cajon;
}

export const estadoInicial: AppState = {
  sucursal: SUCURSALES[0].id,
  categoria: 'todos',
  busqueda: '',
  soloStock: false,
  orden: 'destacados',
  pedido: {},
  cajon: null,
};

const CLAVE = 'fr_estado';

/** Lee sucursal y pedido persistidos, validando contra los datos actuales. */
export function cargar(): Pick<AppState, 'sucursal' | 'pedido'> {
  const base = { sucursal: estadoInicial.sucursal, pedido: {} as Pedido };
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || '{}');
    if (g.sucursal && SUCURSALES.some((s) => s.id === g.sucursal)) base.sucursal = g.sucursal;
    if (g.pedido && typeof g.pedido === 'object') {
      Object.entries(g.pedido).forEach(([id, c]) => {
        if (PRODUCTOS.some((p) => p.id === id) && Number.isFinite(c) && (c as number) > 0) {
          base.pedido[id] = c as number;
        }
      });
    }
  } catch {
    /* datos corruptos o modo privado: seguimos con los valores por defecto */
  }
  return base;
}

/** Persiste solo lo que debe sobrevivir a recargas: sucursal y pedido. */
export function guardar(estado: AppState): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ sucursal: estado.sucursal, pedido: estado.pedido }));
  } catch {
    /* modo privado: seguimos sin persistir */
  }
}
