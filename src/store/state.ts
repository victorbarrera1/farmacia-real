import type { Orden, Pedido } from '../types';
import { getProductos, getSucursales } from '../data/repo';
import { CLAVES } from '../config';

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
  /** Id del producto con la ficha de detalle abierta. */
  detalle: string | null;
}

export const estadoInicial: AppState = {
  sucursal: getSucursales()[0].id,
  categoria: 'todos',
  busqueda: '',
  soloStock: false,
  orden: 'destacados',
  pedido: {},
  cajon: null,
  detalle: null,
};

/** Lee sucursal y pedido persistidos, validando contra los datos vigentes. */
export function cargar(): Pick<AppState, 'sucursal' | 'pedido'> {
  const sucursales = getSucursales();
  const productos = getProductos();
  const base = { sucursal: sucursales[0].id, pedido: {} as Pedido };
  try {
    const g = JSON.parse(localStorage.getItem(CLAVES.estado) || '{}');
    if (g.sucursal && sucursales.some((s) => s.id === g.sucursal)) base.sucursal = g.sucursal;
    if (g.pedido && typeof g.pedido === 'object') {
      Object.entries(g.pedido).forEach(([id, c]) => {
        if (productos.some((p) => p.id === id) && Number.isFinite(c) && (c as number) > 0) {
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
    localStorage.setItem(
      CLAVES.estado,
      JSON.stringify({ sucursal: estado.sucursal, pedido: estado.pedido }),
    );
  } catch {
    /* modo privado: seguimos sin persistir */
  }
}
