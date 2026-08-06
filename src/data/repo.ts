import type { Dia, Ilustracion, Producto, Sucursal, Tramo } from '../types';
import { CLAVES } from '../config';
import { SUCURSALES as SUCURSALES_ORIGINAL } from './sucursales';
import { PRODUCTOS as PRODUCTOS_ORIGINAL } from './productos';

/* ================================================================
   REPOSITORIO EN RUNTIME
   ----------------------------------------------------------------
   Fuente única de verdad de productos y sucursales para toda la app.
   Arranca desde los archivos de `src/data/` y, si el panel guardó
   ediciones en localStorage, esas ediciones ganan.

   Es un "external store" simple (getSnapshot + suscribir) para que la
   tienda y el panel se enteren de los cambios sin prop-drilling.

   INVARIANTE CENTRAL: `producto.st` es un array alineado por posición
   con `getSucursales()`. Cualquier cambio en las sucursales redimensiona
   los st[] de todos los productos (alta → 0; baja → se quita la posición).

   TODO(api): sustituir funciones de lectura/escritura por fetch a la API real
   (GET/POST/PUT/DELETE /api/productos y /api/sucursales) manteniendo
   esta misma superficie pública.
   ================================================================ */

const ILUSTRACIONES: Ilustracion[] = [
  'caja', 'frasco', 'tubo', 'bomba', 'tarro', 'paquete', 'aparato', 'inhalador', 'sobre',
];

/* ------------------------- saneamiento ------------------------- */

const txt = (v: unknown, alt = ''): string => (typeof v === 'string' && v.trim() ? v.trim() : alt);
const entero = (v: unknown, alt = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : alt;
};
const bool = (v: unknown): boolean => v === true;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function sanearTramo(v: unknown): Tramo | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const d = Array.isArray(o.d)
    ? (o.d.filter((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 6) as Dia[])
    : [];
  if (!d.length) return null;
  const et = txt(o.et, 'Horario');
  if (o.cerrado === true) return { d, et, cerrado: true };
  const abre = txt(o.abre);
  const cierra = txt(o.cierra);
  if (!HORA.test(abre) || !HORA.test(cierra)) return null;
  return { d, et, abre, cierra };
}

function sanearSucursal(v: unknown): Sucursal | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const id = txt(o.id);
  const nombre = txt(o.nombre);
  if (!id || !nombre) return null;
  const horario = Array.isArray(o.horario)
    ? o.horario.map(sanearTramo).filter((t): t is Tramo => t !== null)
    : [];
  return {
    id,
    nombre,
    corto: txt(o.corto, nombre),
    comuna: txt(o.comuna, '—'),
    direccion: txt(o.direccion, '—'),
    telefono: txt(o.telefono),
    /* wa.me solo acepta dígitos (código de país incluido). */
    whatsapp: txt(o.whatsapp).replace(/\D/g, ''),
    horario,
    mapa: txt(o.mapa, txt(o.direccion, nombre)),
  };
}

function sanearProducto(v: unknown): Producto | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const id = txt(o.id);
  const n = txt(o.n);
  if (!id || !n) return null;
  const il = txt(o.il) as Ilustracion;
  return {
    id,
    n,
    pres: txt(o.pres, '—'),
    lab: txt(o.lab, '—'),
    act: txt(o.act, '—'),
    cat: txt(o.cat, 'medicamentos'),
    il: ILUSTRACIONES.includes(il) ? il : 'caja',
    p: entero(o.p),
    ...(bool(o.be) ? { be: true } : {}),
    ...(bool(o.rec) ? { rec: true } : {}),
    ...(bool(o.frio) ? { frio: true } : {}),
    ...(txt(o.desc) ? { desc: txt(o.desc) } : {}),
    st: Array.isArray(o.st) ? o.st.map((u) => entero(u)) : [],
  };
}

/** Alinea `st` con la cantidad de sucursales (rellena con 0, recorta el resto). */
function alinear(productos: Producto[], nSuc: number): Producto[] {
  return productos.map((p) => {
    if (p.st.length === nSuc) return p;
    const st = Array.from({ length: nSuc }, (_, i) => p.st[i] ?? 0);
    return { ...p, st };
  });
}

/* ----------------------- persistencia ------------------------- */

function leer(clave: string): unknown {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; /* modo privado o JSON corrupto */
  }
}

function escribir(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* modo privado: seguimos en memoria */
  }
}

function borrar(clave: string): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    /* nada que hacer */
  }
}

/* ------------------------- estado ----------------------------- */

function cargarSucursales(): Sucursal[] {
  const g = leer(CLAVES.sucursales);
  if (!Array.isArray(g)) return SUCURSALES_ORIGINAL;
  const lista = g.map(sanearSucursal).filter((s): s is Sucursal => s !== null);
  return lista.length ? lista : SUCURSALES_ORIGINAL;
}

function cargarProductos(nSuc: number): Producto[] {
  const g = leer(CLAVES.productos);
  if (!Array.isArray(g)) return alinear(PRODUCTOS_ORIGINAL, nSuc);
  const lista = g.map(sanearProducto).filter((p): p is Producto => p !== null);
  return alinear(lista.length ? lista : PRODUCTOS_ORIGINAL, nSuc);
}

let sucursales: Sucursal[] = cargarSucursales();
let productos: Producto[] = cargarProductos(sucursales.length);

const oyentes = new Set<() => void>();
const avisar = (): void => oyentes.forEach((f) => f());

/* --------------------- lectura (snapshots) -------------------- */

/** Sucursales vigentes. La referencia solo cambia cuando hay edición. */
export const getSucursales = (): Sucursal[] => sucursales;

/** Catálogo vigente. La referencia solo cambia cuando hay edición. */
export const getProductos = (): Producto[] => productos;

/** Suscripción para `useSyncExternalStore`. */
export function suscribir(fn: () => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** ¿El panel tiene ediciones guardadas (vs. los datos originales)? */
export const hayEdicionProductos = (): boolean => leer(CLAVES.productos) !== null;
export const hayEdicionSucursales = (): boolean => leer(CLAVES.sucursales) !== null;

/* ------------------------- escritura -------------------------- */

function fijarProductos(lista: Producto[], persistir = true): void {
  productos = alinear(lista, sucursales.length);
  if (persistir) escribir(CLAVES.productos, productos);
  avisar();
}

/**
 * Reemplaza las sucursales y **reindexa** el stock de todos los productos
 * para no romper la alineación de `st[]`: cada producto conserva sus
 * unidades por id de sucursal, las nuevas entran con 0 y las eliminadas
 * pierden su posición.
 */
function fijarSucursales(lista: Sucursal[], persistir = true): void {
  const antes = sucursales.map((s) => s.id);
  const despues = lista.map((s) => s.id);
  sucursales = lista;

  productos = productos.map((p) => ({
    ...p,
    st: despues.map((id) => {
      const i = antes.indexOf(id);
      return i >= 0 ? p.st[i] ?? 0 : 0;
    }),
  }));

  if (persistir) {
    escribir(CLAVES.sucursales, sucursales);
    escribir(CLAVES.productos, productos);
  }
  avisar();
}

/* --- Productos --- */

/** Crea o actualiza un producto (upsert por id). */
export function guardarProducto(p: Producto): void {
  const limpio = sanearProducto(p);
  if (!limpio) return;
  const i = productos.findIndex((x) => x.id === limpio.id);
  const lista = [...productos];
  if (i >= 0) lista[i] = limpio;
  else lista.push(limpio);
  fijarProductos(lista);
}

export function eliminarProducto(id: string): void {
  fijarProductos(productos.filter((p) => p.id !== id));
}

/** Vuelve al catálogo de `src/data/productos.ts`. */
export function restaurarProductos(): void {
  borrar(CLAVES.productos);
  productos = alinear(PRODUCTOS_ORIGINAL, sucursales.length);
  avisar();
}

/** Fija las unidades de un producto en una sucursal (por índice). */
export function fijarStock(id: string, idx: number, unidades: number): void {
  fijarProductos(
    productos.map((p) => {
      if (p.id !== id) return p;
      const st = [...p.st];
      st[idx] = entero(unidades);
      return { ...p, st };
    }),
  );
}

/** Suma un delta (+1 / −1) al stock de un producto en una sucursal. */
export function ajustarStock(id: string, idx: number, delta: number): void {
  fijarProductos(
    productos.map((p) => {
      if (p.id !== id) return p;
      const st = [...p.st];
      st[idx] = Math.max(0, (st[idx] ?? 0) + delta);
      return { ...p, st };
    }),
  );
}

/* --- Sucursales --- */

/** Crea o actualiza una sucursal (upsert por id). Reindexa el stock. */
export function guardarSucursal(s: Sucursal): void {
  const limpia = sanearSucursal(s);
  if (!limpia) return;
  const i = sucursales.findIndex((x) => x.id === limpia.id);
  const lista = [...sucursales];
  if (i >= 0) lista[i] = limpia;
  else lista.push(limpia);
  fijarSucursales(lista);
}

/**
 * Elimina una sucursal y su columna de stock en todos los productos.
 * Se niega a dejar el sistema sin sucursales (la tienda no funcionaría).
 */
export function eliminarSucursal(id: string): boolean {
  if (sucursales.length <= 1) return false;
  fijarSucursales(sucursales.filter((s) => s.id !== id));
  return true;
}

/** Vuelve a las sucursales de `src/data/sucursales.ts`. */
export function restaurarSucursales(): void {
  borrar(CLAVES.sucursales);
  fijarSucursales(SUCURSALES_ORIGINAL, false);
  escribir(CLAVES.productos, productos);
}

/* ------------------------- utilidades ------------------------- */

const azar = (): string => Math.random().toString(36).slice(2, 7);

/** Id único para un producto nuevo (los originales usan `p0`…`pN`). */
export const nuevoIdProducto = (): string => `pn-${Date.now().toString(36)}-${azar()}`;

/** Id legible y único para una sucursal nueva, derivado del nombre. */
export function nuevoIdSucursal(nombre: string): string {
  const base =
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'sucursal';
  if (!sucursales.some((s) => s.id === base)) return base;
  return `${base}-${azar()}`;
}

/** Producto en blanco para el formulario de alta. */
export const productoNuevo = (): Producto => ({
  id: nuevoIdProducto(),
  n: '',
  pres: '',
  lab: '',
  act: '',
  cat: 'medicamentos',
  il: 'caja',
  p: 0,
  st: sucursales.map(() => 0),
});

/** Sucursal en blanco para el formulario de alta (horario típico). */
export const sucursalNueva = (): Sucursal => ({
  id: '',
  nombre: '',
  corto: '',
  comuna: '',
  direccion: '',
  telefono: '',
  whatsapp: '',
  horario: [
    { d: [1, 2, 3, 4, 5], et: 'Lunes a viernes', abre: '09:00', cierra: '21:00' },
    { d: [6], et: 'Sábado', abre: '10:00', cierra: '20:00' },
    { d: [0], et: 'Domingo', cerrado: true },
  ],
  mapa: '',
});

/** Ilustraciones disponibles para el selector del panel. */
export const ILUSTRACIONES_DISPONIBLES = ILUSTRACIONES;
