import type { Producto, Sucursal } from '../types';
import { CLAVES } from '../config';
import {
  type Catalogo, ILUSTRACIONES, ajustarStockEn, alinearStock, fijarPrecioEn, fijarStockEn,
  fijarVisibilidadEn, idSucursalDesde, nuevoIdProducto as nuevoId, quitarProducto, quitarSucursal,
  sanearCatalogo, upsertProducto, upsertSucursal,
} from '../lib/dominio';
import { ErrorApi, capacidades, pedir } from '../lib/api';
import { SUCURSALES as SUCURSALES_ORIGINAL } from './sucursales';
import { PRODUCTOS as PRODUCTOS_ORIGINAL } from './productos';

/* ================================================================
   REPOSITORIO EN RUNTIME
   ----------------------------------------------------------------
   Fuente única de verdad de productos y sucursales para toda la app.
   Es un "external store" (getSnapshot + suscribir) que la tienda y el
   panel consumen con useSyncExternalStore.

   Dos orígenes posibles, decididos en `hidratar()`:

   · `api`   → los datos viven en el backend (ver api/). Las escrituras
               son optimistas: se aplican al instante y se envían; si el
               servidor falla, se revierte recargando del servidor.
   · `local` → sin backend: los datos viven en localStorage, igual que
               antes de que existiera la API.

   INVARIANTE CENTRAL: `producto.st` está alineado por posición con
   `getSucursales()`. Todo el CRUD pasa por `src/lib/dominio.ts`, que es
   el mismo código que usa el servidor.
   ================================================================ */

export type Origen = 'local' | 'api';

/* ----------------------- persistencia local -------------------- */

function leerLocal(clave: string): unknown {
  try {
    const bruto = localStorage.getItem(clave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null; /* modo privado o JSON corrupto */
  }
}

function escribirLocal(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* modo privado: seguimos en memoria */
  }
}

function borrarLocal(clave: string): void {
  try {
    localStorage.removeItem(clave);
  } catch {
    /* nada que hacer */
  }
}

/* --------------------------- estado ---------------------------- */

const fabrica = (): Catalogo => ({
  sucursales: SUCURSALES_ORIGINAL,
  productos: alinearStock(PRODUCTOS_ORIGINAL, SUCURSALES_ORIGINAL.length),
  version: 0,
});

/** Ediciones guardadas por el panel en modo local (compatibilidad). */
export const hayEdicionProductos = (): boolean => leerLocal(CLAVES.productos) !== null;
export const hayEdicionSucursales = (): boolean => leerLocal(CLAVES.sucursales) !== null;
export const hayEdicionLocal = (): boolean => hayEdicionProductos() || hayEdicionSucursales();

function inicial(): Catalogo {
  const base = fabrica();
  /* 1) Ediciones del panel en modo local. */
  if (hayEdicionLocal()) {
    return sanearCatalogo(
      {
        productos: leerLocal(CLAVES.productos) ?? base.productos,
        sucursales: leerLocal(CLAVES.sucursales) ?? base.sucursales,
      },
      base,
    );
  }
  /* 2) Copia del último catálogo servido por la API (pinta sin esperar el fetch). */
  const cache = leerLocal(CLAVES.cache);
  if (cache) return sanearCatalogo(cache, base);
  /* 3) Datos de fábrica del repositorio. */
  return base;
}

let cat: Catalogo = inicial();
let origen: Origen = 'local';
let pendientes = 0;
let error: string | null = null;

const oyentes = new Set<() => void>();
const avisar = (): void => oyentes.forEach((f) => f());

/* --------------------- lectura (snapshots) --------------------- */

export const getSucursales = (): Sucursal[] => cat.sucursales;
export const getProductos = (): Producto[] => cat.productos;
export const getOrigen = (): Origen => origen;

export interface Sincronizacion {
  origen: Origen;
  /** true mientras hay escrituras en vuelo hacia el servidor. */
  guardando: boolean;
  /** Último error de sincronización, ya en lenguaje humano. */
  error: string | null;
}

let sinc: Sincronizacion = { origen, guardando: false, error: null };

/** Snapshot estable del estado de sincronización (para useSyncExternalStore). */
export const getSincronizacion = (): Sincronizacion => sinc;

function refrescarSinc(): void {
  const siguiente: Sincronizacion = { origen, guardando: pendientes > 0, error };
  if (
    siguiente.origen !== sinc.origen ||
    siguiente.guardando !== sinc.guardando ||
    siguiente.error !== sinc.error
  ) {
    sinc = siguiente;
  }
}

/** Suscripción para `useSyncExternalStore`. */
export function suscribir(fn: () => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/* -------------------------- escritura -------------------------- */

function aplicar(siguiente: Catalogo, persistirLocal = true): void {
  cat = siguiente;
  if (origen === 'local' && persistirLocal) {
    escribirLocal(CLAVES.productos, cat.productos);
    escribirLocal(CLAVES.sucursales, cat.sucursales);
  }
  if (origen === 'api') escribirLocal(CLAVES.cache, cat);
  refrescarSinc();
  avisar();
}

/**
 * Envía una escritura al servidor (solo en modo `api`). Es optimista: el
 * cambio ya se aplicó localmente; si el servidor rechaza, se recarga su
 * versión para no quedar con datos fantasma.
 */
function enviar(hacer: () => Promise<{ productos?: Producto[]; sucursales?: Sucursal[]; version?: number }>): void {
  if (origen !== 'api') return;
  pendientes++;
  error = null;
  refrescarSinc();
  avisar();

  hacer()
    .then((r) => {
      if (r.productos || r.sucursales) {
        cat = sanearCatalogo(
          {
            productos: r.productos ?? cat.productos,
            sucursales: r.sucursales ?? cat.sucursales,
            version: r.version ?? Date.now(),
          },
          fabrica(),
        );
        escribirLocal(CLAVES.cache, cat);
      }
    })
    .catch(async (e: unknown) => {
      const mensaje = e instanceof ErrorApi ? e.mensajeHumano() : 'No se pudo guardar en el servidor';
      error = mensaje;
      /* Revertimos trayendo el estado real del servidor. */
      try {
        const r = await pedir<{ productos: Producto[]; sucursales: Sucursal[]; version: number }>('/api/catalogo');
        cat = sanearCatalogo(r, fabrica());
        escribirLocal(CLAVES.cache, cat);
      } catch {
        /* si tampoco se puede leer, dejamos lo que hay y el aviso visible */
      }
    })
    .finally(() => {
      pendientes--;
      refrescarSinc();
      avisar();
    });
}

/* --------------------------- hidratar -------------------------- */

/**
 * Decide el origen de los datos y carga el catálogo del servidor si existe.
 * Se llama una vez al arrancar la app (ver src/main.tsx).
 */
export async function hidratar(): Promise<Origen> {
  const caps = await capacidades();
  if (!caps.api || caps.almacen === 'sin-configurar') {
    origen = 'local';
    refrescarSinc();
    avisar();
    return origen;
  }

  try {
    const r = await pedir<{ productos: Producto[]; sucursales: Sucursal[]; version: number }>(
      '/api/catalogo',
      { silencioso: true },
    );
    origen = 'api';
    cat = sanearCatalogo(r, fabrica());
    escribirLocal(CLAVES.cache, cat);
    error = null;
  } catch {
    origen = 'local';
    error = null;
  }
  refrescarSinc();
  avisar();
  return origen;
}

/** Vuelve a leer el catálogo del servidor (botón "recargar" del panel). */
export async function recargar(): Promise<void> {
  if (origen !== 'api') return;
  const r = await pedir<{ productos: Producto[]; sucursales: Sucursal[]; version: number }>('/api/catalogo');
  cat = sanearCatalogo(r, fabrica());
  escribirLocal(CLAVES.cache, cat);
  error = null;
  refrescarSinc();
  avisar();
}

/* --------------------------- productos ------------------------- */

/** Crea o actualiza un producto (upsert por id). */
export function guardarProducto(p: Producto): void {
  const siguiente = upsertProducto(cat, p);
  if (siguiente === cat) return;
  aplicar(siguiente);
  enviar(() => pedir('/api/productos', { metodo: 'PUT', cuerpo: p }));
}

export function eliminarProducto(id: string): void {
  const siguiente = quitarProducto(cat, id);
  if (siguiente === cat) return;
  aplicar(siguiente);
  enviar(() => pedir(`/api/productos?id=${encodeURIComponent(id)}`, { metodo: 'DELETE' }));
}

/** Vuelve al catálogo de `src/data/productos.ts`. */
export function restaurarProductos(): void {
  const base = fabrica();
  borrarLocal(CLAVES.productos);
  aplicar(
    { ...cat, productos: alinearStock(base.productos, cat.sucursales.length), version: Date.now() },
    false,
  );
  enviar(() => pedir('/api/catalogo?accion=restaurarProductos', { metodo: 'POST' }));
}

/* ----------------------------- stock --------------------------- */

/** Fija las unidades de un producto en una sucursal (por índice). */
export function fijarStock(id: string, idx: number, unidades: number): void {
  const siguiente = fijarStockEn(cat, id, idx, unidades);
  if (siguiente === cat) return;
  aplicar(siguiente);
  const sucursalId = cat.sucursales[idx]?.id;
  enviar(() =>
    pedir('/api/stock', { metodo: 'PATCH', cuerpo: { id, sucursalId, unidades: Math.max(0, Math.trunc(unidades) || 0) } }),
  );
}

/** Suma un delta (+1 / −1) al stock de un producto en una sucursal. */
export function ajustarStock(id: string, idx: number, delta: number): void {
  const siguiente = ajustarStockEn(cat, id, idx, delta);
  if (siguiente === cat) return;
  aplicar(siguiente);
  const sucursalId = cat.sucursales[idx]?.id;
  enviar(() => pedir('/api/stock', { metodo: 'PATCH', cuerpo: { id, sucursalId, delta } }));
}

/* ------------------ visibilidad y precio por local ------------- */

/**
 * Muestra u oculta un producto en la tienda de una sucursal.
 * El encargado del local puede hacerlo sobre su propia posición: el servidor
 * lo valida (ver api/productos.ts) y solo acepta su `vis`.
 */
export function fijarVisibilidad(id: string, idx: number, visible: boolean): void {
  const siguiente = fijarVisibilidadEn(cat, id, idx, visible);
  if (siguiente === cat) return;
  aplicar(siguiente);
  const producto = siguiente.productos.find((p) => p.id === id);
  if (producto) enviar(() => pedir('/api/productos', { metodo: 'PUT', cuerpo: producto }));
}

/** Fija (o quita, con null) el precio especial de un producto en una sucursal. */
export function fijarPrecioSucursal(id: string, idx: number, precio: number | null): void {
  const siguiente = fijarPrecioEn(cat, id, idx, precio);
  if (siguiente === cat) return;
  aplicar(siguiente);
  const producto = siguiente.productos.find((p) => p.id === id);
  if (producto) enviar(() => pedir('/api/productos', { metodo: 'PUT', cuerpo: producto }));
}

/* --------------------------- sucursales ------------------------ */
/** Crea o actualiza una sucursal (upsert por id). Reindexa el stock. */
export function guardarSucursal(s: Sucursal): void {
  const siguiente = upsertSucursal(cat, s);
  if (siguiente === cat) return;
  aplicar(siguiente);
  enviar(() => pedir('/api/sucursales', { metodo: 'PUT', cuerpo: s }));
}

/**
 * Elimina una sucursal y su columna de stock en todos los productos.
 * Devuelve false si era la última (la tienda necesita al menos una).
 */
export function eliminarSucursal(id: string): boolean {
  const siguiente = quitarSucursal(cat, id);
  if (!siguiente) return false;
  aplicar(siguiente);
  enviar(() => pedir(`/api/sucursales?id=${encodeURIComponent(id)}`, { metodo: 'DELETE' }));
  return true;
}

/** Vuelve a las sucursales de `src/data/sucursales.ts`. */
export function restaurarSucursales(): void {
  const base = fabrica();
  borrarLocal(CLAVES.sucursales);
  const productos = cat.productos.map((p) => ({
    ...p,
    st: base.sucursales.map((s) => {
      const i = cat.sucursales.findIndex((x) => x.id === s.id);
      return i >= 0 ? p.st[i] ?? 0 : 0;
    }),
  }));
  aplicar({ sucursales: base.sucursales, productos, version: Date.now() }, false);
  if (origen === 'local') {
    escribirLocal(CLAVES.productos, cat.productos);
  }
  enviar(() => pedir('/api/catalogo?accion=restaurarSucursales', { metodo: 'POST' }));
}

/* ------------------ catálogo completo (CSV / respaldo) --------- */

/**
 * Reemplaza catálogo y sucursales de una vez. Lo usan la importación CSV y
 * la restauración de un respaldo JSON.
 */
export function reemplazarCatalogo(productos: Producto[], sucursales?: Sucursal[]): void {
  const siguiente = sanearCatalogo(
    { productos, sucursales: sucursales ?? cat.sucursales, version: Date.now() },
    fabrica(),
  );
  aplicar(siguiente);
  enviar(() =>
    pedir('/api/catalogo', {
      metodo: 'PUT',
      cuerpo: { productos: siguiente.productos, sucursales: siguiente.sucursales },
    }),
  );
}

/**
 * Migración: sube al servidor las ediciones que quedaron en este navegador
 * (del período sin backend) y limpia las claves locales.
 */
export async function subirLocalAlServidor(): Promise<void> {
  if (origen !== 'api') throw new ErrorApi('El backend no está disponible', 0);
  const local = sanearCatalogo(
    {
      productos: leerLocal(CLAVES.productos) ?? cat.productos,
      sucursales: leerLocal(CLAVES.sucursales) ?? cat.sucursales,
    },
    fabrica(),
  );
  const r = await pedir<{ productos: Producto[]; sucursales: Sucursal[]; version: number }>(
    '/api/catalogo',
    { metodo: 'PUT', cuerpo: { productos: local.productos, sucursales: local.sucursales } },
  );
  borrarLocal(CLAVES.productos);
  borrarLocal(CLAVES.sucursales);
  cat = sanearCatalogo(r, fabrica());
  escribirLocal(CLAVES.cache, cat);
  error = null;
  refrescarSinc();
  avisar();
}

/** Descarta las ediciones locales sin subirlas (se queda con las del servidor). */
export function descartarLocal(): void {
  borrarLocal(CLAVES.productos);
  borrarLocal(CLAVES.sucursales);
  avisar();
}

/* ------------------------- utilidades ------------------------- */

export const nuevoIdProducto = nuevoId;

/** Id legible y único para una sucursal nueva, derivado del nombre. */
export const nuevoIdSucursal = (nombre: string): string =>
  idSucursalDesde(nombre, cat.sucursales.map((s) => s.id));

/** Producto en blanco para el formulario de alta. */
export const productoNuevo = (): Producto => ({
  id: nuevoId(),
  n: '',
  pres: '',
  lab: '',
  act: '',
  cat: 'medicamentos',
  il: 'caja',
  p: 0,
  st: cat.sucursales.map(() => 0),
  vis: cat.sucursales.map(() => true),
  px: cat.sucursales.map(() => null),
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
