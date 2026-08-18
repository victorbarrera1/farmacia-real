import type { Orden, Pedido, RangoPrecio } from '../types';
import { getProductos, getSucursales } from '../data/repo';
import { CLAVES } from '../config';

/** Cajón (drawer) actualmente abierto, si hay alguno. */
export type Cajon = 'pedido' | 'suc' | 'filtros' | 'menu' | null;

export interface AppState {
  sucursal: string;
  categoria: string;
  busqueda: string;
  soloStock: boolean;
  orden: Orden;
  /** Facetas: laboratorios marcados (vacío = todos). */
  labs: string[];
  /** Faceta: solo bioequivalentes. */
  soloBio: boolean;
  /** Faceta: dejar fuera lo que exige receta médica. */
  sinReceta: boolean;
  /** Faceta: tramo de precio. */
  precio: RangoPrecio;
  pedido: Pedido;
  cajon: Cajon;
  /** Id del producto con la ficha de detalle abierta. */
  detalle: string | null;
  /** Modal de políticas de reserva y términos del servicio. */
  legal: boolean;
  /** Modal inicial que pregunta dónde retira (patrón de retail farmacia). */
  gate: boolean;
}

export const estadoInicial: AppState = {
  sucursal: getSucursales()[0].id,
  categoria: 'todos',
  busqueda: '',
  soloStock: false,
  orden: 'destacados',
  labs: [],
  soloBio: false,
  sinReceta: false,
  precio: 'todos',
  pedido: {},
  cajon: null,
  detalle: null,
  legal: false,
  gate: false,
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

/** ¿Ya eligió dónde retira en una visita anterior? */
export function ubicacionElegida(): boolean {
  try {
    return localStorage.getItem(CLAVES.ubicacion) === 'si';
  } catch {
    return true; /* modo privado: no insistimos con el modal */
  }
}

/** Marca la ubicación como elegida para no volver a preguntar. */
export function marcarUbicacion(): void {
  try {
    localStorage.setItem(CLAVES.ubicacion, 'si');
  } catch {
    /* modo privado: se preguntará de nuevo en la próxima visita */
  }
}

/** ¿Hay alguna faceta del catálogo activa? (para el botón "limpiar"). */
export const hayFiltros = (e: AppState): boolean =>
  e.labs.length > 0 || e.soloBio || e.sinReceta || e.precio !== 'todos' || e.soloStock;

/** Rango [min, max] en CLP de cada tramo de precio. */
export const RANGOS: Record<RangoPrecio, [number, number]> = {
  todos: [0, Infinity],
  hasta5: [0, 5000],
  '5a15': [5000, 15000],
  '15a30': [15000, 30000],
  sobre30: [30000, Infinity],
};

/** Etiqueta legible de cada tramo de precio. */
export const ET_RANGOS: Record<RangoPrecio, string> = {
  todos: 'Cualquier precio',
  hasta5: 'Hasta $5.000',
  '5a15': '$5.000 a $15.000',
  '15a30': '$15.000 a $30.000',
  sobre30: 'Más de $30.000',
};
