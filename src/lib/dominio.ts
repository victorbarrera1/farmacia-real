import type { Dia, Ilustracion, Producto, Sucursal, Tramo } from '../types';

/* ================================================================
   DOMINIO COMPARTIDO — saneamiento e invariantes.
   ----------------------------------------------------------------
   Este módulo es PURO: no toca `window`, `localStorage` ni `fetch`.
   Lo usan por igual el repositorio del navegador (src/data/repo.ts) y
   las funciones serverless (api/_lib/datos.ts), para que el dato que
   valida el cliente sea exactamente el que valida el servidor.

   Nunca confiar en la entrada: todo lo que venga de localStorage, de la
   API, de un CSV o del formulario del panel pasa por acá.
   ================================================================ */

export const ILUSTRACIONES: Ilustracion[] = [
  'caja', 'frasco', 'tubo', 'bomba', 'tarro', 'paquete', 'aparato', 'inhalador', 'sobre',
];

/** Categorías válidas (deben coincidir con src/data/categorias.ts). */
export const CATEGORIAS_VALIDAS = [
  'medicamentos', 'dermo', 'vitaminas', 'infantil', 'cuidado', 'equipos',
];

/** Largo máximo de los textos libres, para no inflar el almacenamiento. */
const MAX_TEXTO = 200;
const MAX_DESC = 1200;
/** Tope duro de unidades por sucursal (evita basura tipo 1e9). */
const MAX_UNIDADES = 1_000_000;
/** Tope duro de precio en CLP. */
const MAX_PRECIO = 100_000_000;

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ------------------------- primitivas ------------------------- */

export function txt(v: unknown, alt = '', max = MAX_TEXTO): string {
  if (typeof v !== 'string') return alt;
  const t = v.trim().replace(/\s+/g, ' ').slice(0, max);
  return t || alt;
}

export function entero(v: unknown, alt = 0, max = MAX_UNIDADES): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return alt;
  return Math.min(max, Math.max(0, Math.trunc(n)));
}

export const bool = (v: unknown): boolean => v === true;

/**
 * Sanea un identificador: minúsculas, sin tildes, solo `a-z 0-9 -`.
 * Se usa tanto para ids de sucursal (derivados del nombre) como para
 * validar los ids que llegan por la API o desde localStorage.
 */
export function sanearId(v: unknown, largo = 32): string {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, largo);
}

const azar = (): string => Math.random().toString(36).slice(2, 7);

/** Id único para un producto nuevo (los originales usan `p0`…`pN`). */
export const nuevoIdProducto = (): string => `pn-${Date.now().toString(36)}-${azar()}`;

/** Id legible y único para una sucursal, derivado de su nombre. */
export function idSucursalDesde(nombre: string, ocupados: string[] = []): string {
  const base = sanearId(nombre, 24) || 'sucursal';
  if (!ocupados.includes(base)) return base;
  let intento = `${base}-${azar()}`;
  while (ocupados.includes(intento)) intento = `${base}-${azar()}`;
  return intento;
}

/* ------------------------ saneamiento ------------------------- */

export function sanearTramo(v: unknown): Tramo | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const d = Array.isArray(o.d)
    ? ([...new Set(o.d)].filter(
        (x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 6,
      ) as Dia[])
    : [];
  if (!d.length) return null;
  const et = txt(o.et, 'Horario', 60);
  if (o.cerrado === true) return { d, et, cerrado: true };
  const abre = txt(o.abre, '', 5);
  const cierra = txt(o.cierra, '', 5);
  if (!HORA.test(abre) || !HORA.test(cierra)) return null;
  return { d, et, abre, cierra };
}

export function sanearSucursal(v: unknown): Sucursal | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const nombre = txt(o.nombre, '', 80);
  const id = sanearId(o.id);
  if (!id || !nombre) return null;
  const horario = Array.isArray(o.horario)
    ? o.horario.map(sanearTramo).filter((t): t is Tramo => t !== null)
    : [];
  const direccion = txt(o.direccion, '—', 160);
  return {
    id,
    nombre,
    corto: txt(o.corto, nombre, 40),
    comuna: txt(o.comuna, '—', 60),
    direccion,
    telefono: txt(o.telefono, '', 30),
    /* wa.me solo acepta dígitos, con código de país incluido. */
    whatsapp: String(o.whatsapp ?? '').replace(/\D/g, '').slice(0, 15),
    horario,
    mapa: txt(o.mapa, direccion, 200),
  };
}

export function sanearProducto(v: unknown): Producto | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const id = sanearId(o.id, 48);
  const n = txt(o.n, '', 120);
  if (!id || !n) return null;
  const il = txt(o.il) as Ilustracion;
  const cat = txt(o.cat, 'medicamentos', 40);
  return {
    id,
    n,
    pres: txt(o.pres, '—', 80),
    lab: txt(o.lab, '—', 80),
    act: txt(o.act, '—', 120),
    cat: CATEGORIAS_VALIDAS.includes(cat) ? cat : 'medicamentos',
    il: ILUSTRACIONES.includes(il) ? il : 'caja',
    p: entero(o.p, 0, MAX_PRECIO),
    ...(bool(o.be) ? { be: true } : {}),
    ...(bool(o.rec) ? { rec: true } : {}),
    ...(bool(o.frio) ? { frio: true } : {}),
    ...(txt(o.desc, '', MAX_DESC) ? { desc: txt(o.desc, '', MAX_DESC) } : {}),
    st: Array.isArray(o.st) ? o.st.map((u) => entero(u)) : [],
  };
}

/** Sanea una lista descartando lo inválido y los ids repetidos. */
export function sanearLista<T extends { id: string }>(
  v: unknown,
  sanear: (x: unknown) => T | null,
): T[] {
  if (!Array.isArray(v)) return [];
  const vistos = new Set<string>();
  const out: T[] = [];
  for (const item of v) {
    const limpio = sanear(item);
    if (!limpio || vistos.has(limpio.id)) continue;
    vistos.add(limpio.id);
    out.push(limpio);
  }
  return out;
}

export const sanearProductos = (v: unknown): Producto[] => sanearLista(v, sanearProducto);
export const sanearSucursales = (v: unknown): Sucursal[] => sanearLista(v, sanearSucursal);

/* ---------------------- invariante de st[] --------------------- */

/**
 * INVARIANTE CENTRAL: `producto.st` está alineado por posición con la lista
 * de sucursales. Acá se rellena con 0 o se recorta lo que sobre.
 */
export function alinearStock(productos: Producto[], nSuc: number): Producto[] {
  return productos.map((p) => {
    if (p.st.length === nSuc) return p;
    return { ...p, st: Array.from({ length: nSuc }, (_, i) => p.st[i] ?? 0) };
  });
}

/**
 * Reindexa el stock cuando cambia la lista de sucursales: cada producto
 * conserva sus unidades por *id* de sucursal, las nuevas entran con 0 y las
 * eliminadas pierden su posición.
 */
export function reindexarStock(
  productos: Producto[],
  idsAntes: string[],
  idsDespues: string[],
): Producto[] {
  if (idsAntes.length === idsDespues.length && idsAntes.every((id, i) => id === idsDespues[i])) {
    return alinearStock(productos, idsDespues.length);
  }
  return productos.map((p) => ({
    ...p,
    st: idsDespues.map((id) => {
      const i = idsAntes.indexOf(id);
      return i >= 0 ? p.st[i] ?? 0 : 0;
    }),
  }));
}

/* --------------------- controles de calidad -------------------- */

/**
 * Sucursales que comparten el mismo WhatsApp. Cada local debe tener su
 * propio número: si se repite, el pedido se envía al teléfono equivocado.
 * Devuelve los grupos con más de una sucursal.
 */
export function whatsappRepetidos(sucursales: Sucursal[]): { whatsapp: string; ids: string[] }[] {
  const mapa = new Map<string, string[]>();
  sucursales.forEach((s) => {
    if (!s.whatsapp) return;
    mapa.set(s.whatsapp, [...(mapa.get(s.whatsapp) ?? []), s.id]);
  });
  return [...mapa.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([whatsapp, ids]) => ({ whatsapp, ids }));
}

/** Un WhatsApp chileno válido para wa.me: 56 + 9 dígitos (móvil). */
export const whatsappValido = (wa: string): boolean => /^56\d{9}$/.test(wa);

/* ================================================================
   CRUD PURO SOBRE EL CATÁLOGO
   ----------------------------------------------------------------
   Las mismas transformaciones las usa el repositorio del navegador y la
   API. Reciben y devuelven un `Catalogo` nuevo (sin mutar) y mantienen
   siempre el invariante de `st[]`.
   ================================================================ */

export interface Catalogo {
  productos: Producto[];
  sucursales: Sucursal[];
  /** Marca de la última escritura (ms). Sirve para detectar cambios. */
  version: number;
}

/** Normaliza un catálogo completo venga de donde venga. */
export function sanearCatalogo(v: unknown, respaldo: Catalogo): Catalogo {
  const o = (v ?? {}) as Record<string, unknown>;
  const sucursales = sanearSucursales(o.sucursales);
  const productos = sanearProductos(o.productos);
  return {
    sucursales: sucursales.length ? sucursales : respaldo.sucursales,
    productos: alinearStock(
      productos.length ? productos : respaldo.productos,
      (sucursales.length ? sucursales : respaldo.sucursales).length,
    ),
    version: entero(o.version, respaldo.version, Number.MAX_SAFE_INTEGER),
  };
}

const conVersion = (c: Catalogo): Catalogo => ({ ...c, version: Date.now() });

/** Crea o reemplaza un producto (upsert por id). */
export function upsertProducto(c: Catalogo, entrada: unknown): Catalogo {
  const p = sanearProducto(entrada);
  if (!p) return c;
  const alineado = alinearStock([p], c.sucursales.length)[0];
  const i = c.productos.findIndex((x) => x.id === alineado.id);
  const productos = [...c.productos];
  if (i >= 0) productos[i] = alineado;
  else productos.push(alineado);
  return conVersion({ ...c, productos });
}

export function quitarProducto(c: Catalogo, id: string): Catalogo {
  const limpio = sanearId(id, 48);
  if (!c.productos.some((p) => p.id === limpio)) return c;
  return conVersion({ ...c, productos: c.productos.filter((p) => p.id !== limpio) });
}

/**
 * Crea o reemplaza una sucursal. En el alta, reindexa el stock de todos los
 * productos para que la nueva posición entre con 0 unidades.
 */
export function upsertSucursal(c: Catalogo, entrada: unknown): Catalogo {
  const s = sanearSucursal(entrada);
  if (!s) return c;
  const i = c.sucursales.findIndex((x) => x.id === s.id);
  const sucursales = [...c.sucursales];
  if (i >= 0) sucursales[i] = s;
  else sucursales.push(s);
  return conVersion({
    ...c,
    sucursales,
    productos: reindexarStock(
      c.productos,
      c.sucursales.map((x) => x.id),
      sucursales.map((x) => x.id),
    ),
  });
}

/**
 * Elimina una sucursal y su columna de stock. Se niega a dejar el sistema
 * sin sucursales: la tienda no funcionaría.
 */
export function quitarSucursal(c: Catalogo, id: string): Catalogo | null {
  const limpio = sanearId(id);
  if (c.sucursales.length <= 1 || !c.sucursales.some((s) => s.id === limpio)) return null;
  const sucursales = c.sucursales.filter((s) => s.id !== limpio);
  return conVersion({
    ...c,
    sucursales,
    productos: reindexarStock(
      c.productos,
      c.sucursales.map((x) => x.id),
      sucursales.map((x) => x.id),
    ),
  });
}

/** Fija las unidades de un producto en una posición de sucursal. */
export function fijarStockEn(c: Catalogo, id: string, idx: number, unidades: number): Catalogo {
  if (idx < 0 || idx >= c.sucursales.length) return c;
  const limpio = sanearId(id, 48);
  return conVersion({
    ...c,
    productos: c.productos.map((p) => {
      if (p.id !== limpio) return p;
      const st = [...p.st];
      st[idx] = entero(unidades);
      return { ...p, st };
    }),
  });
}

/** Suma un delta (+1 / −1) al stock de un producto en una sucursal. */
export function ajustarStockEn(c: Catalogo, id: string, idx: number, delta: number): Catalogo {
  if (idx < 0 || idx >= c.sucursales.length) return c;
  const limpio = sanearId(id, 48);
  const d = Math.trunc(Number(delta) || 0);
  return conVersion({
    ...c,
    productos: c.productos.map((p) => {
      if (p.id !== limpio) return p;
      const st = [...p.st];
      st[idx] = entero((st[idx] ?? 0) + d);
      return { ...p, st };
    }),
  });
}
