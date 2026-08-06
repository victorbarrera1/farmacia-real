/* ================================================================
   Tipos del dominio — contrato único para datos y componentes.
   ================================================================ */

/** Día de la semana: 0 = domingo … 6 = sábado (Date.getDay). */
export type Dia = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Tramo horario de una sucursal. `cerrado` excluye abre/cierra. */
export type Tramo =
  | { d: Dia[]; et: string; abre: string; cierra: string; cerrado?: false }
  | { d: Dia[]; et: string; cerrado: true; abre?: undefined; cierra?: undefined };

export interface Sucursal {
  id: string;
  nombre: string;
  corto: string;
  comuna: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  horario: Tramo[];
  /** Texto para la query de Google Maps. */
  mapa: string;
}

export interface Categoria {
  id: string;
  et: string;
  /** id del ícono en el sprite SVG. */
  ico: IconId;
  /** Bajada corta (se usa en el mega-menú). */
  sub?: string;
}

/** Ilustración de producto (80×80). */
export type Ilustracion =
  | 'caja' | 'frasco' | 'tubo' | 'bomba' | 'tarro'
  | 'paquete' | 'aparato' | 'inhalador' | 'sobre';

export interface Producto {
  /** Se asigna en runtime a partir del índice: `p0`, `p1`, … */
  id: string;
  n: string;
  pres: string;
  lab: string;
  act: string;
  cat: string;
  il: Ilustracion;
  /** Precio referencial en CLP. */
  p: number;
  be?: boolean;
  rec?: boolean;
  frio?: boolean;
  /** Descripción opcional (se muestra en el detalle del producto). */
  desc?: string;
  /** Unidades por sucursal, en el mismo orden que SUCURSALES. */
  st: number[];
  /**
   * Visible en la tienda para esa sucursal, mismo orden que SUCURSALES.
   * Permite que un local saque productos de su catálogo sin borrarlos.
   */
  vis: boolean[];
  /**
   * Precio especial por sucursal (CLP). `null` = usa el precio global `p`.
   * Mismo orden que SUCURSALES.
   */
  px: (number | null)[];
}

/** Pedido: id de producto → cantidad. */
export type Pedido = Record<string, number>;

export type Orden = 'destacados' | 'precio-asc' | 'precio-desc' | 'nombre';

export type NivelStock = 'alto' | 'bajo' | 'cero';

/** Ids de íconos disponibles en el sprite. */
export type IconId =
  | 'i-emblema' | 'i-cruz' | 'i-pin' | 'i-reloj' | 'i-tel' | 'i-wa' | 'i-ig'
  | 'i-lupa' | 'i-x' | 'i-mas' | 'i-check' | 'i-flecha' | 'i-bolsa' | 'i-alerta'
  | 'i-moto' | 'i-escudo' | 'i-pulso' | 'i-corazon' | 'i-pastilla' | 'i-gota'
  | 'i-hoja' | 'i-bebe' | 'i-grilla';
