/* ================================================================
   CONFIGURACIÓN — un solo lugar para claves, URLs y ajustes.
   ================================================================ */

/** URL pública del sitio (canonical, sitemap, JSON-LD, og:url). */
export const SITIO_URL = 'https://farmaciareal.vercel.app';

/* Variables de entorno. Se leen así (y no directo en cada componente) para
   que este archivo también se pueda importar desde Node (scripts/ y las
   rutas de Next): ahí `import.meta.env` no existe y `process.env` sí. En el
   navegador, Next sustituye en build las variables `NEXT_PUBLIC_*`. */
function leerEnv(clave: string): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return (process.env as Record<string, string | undefined>)[clave];
}

/**
 * ACCESO AL PANEL (/panel)
 * ----------------------------------------------------------------
 * La clave se valida SOLO en el servidor: `POST /api/sesion` la compara
 * contra el hash scrypt de `ADMIN_PASS_HASH` (admin global) o de
 * `SUCURSAL_PASS_HASHES` (encargado de un local) y responde con una cookie
 * HttpOnly firmada. Ni la clave ni su hash viajan en el bundle.
 *
 * El único fallback es para desarrollo sin backend: si se definen
 * `NEXT_PUBLIC_ADMIN_PASS_HASH` y `NEXT_PUBLIC_ADMIN_PASS_SALT` en un `.env`
 * local (nunca en producción), el panel compara un PBKDF2 en el navegador.
 * Sin esas variables y sin API, el panel no deja entrar.
 *
 * Generar todos los valores:  npm run clave
 */
export const CLAVE_LOCAL = {
  /** Hash PBKDF2-SHA256 (hex). Vacío = modo sin backend deshabilitado. */
  hash: leerEnv('NEXT_PUBLIC_ADMIN_PASS_HASH') ?? '',
  /** Sal (hex) del hash anterior. */
  sal: leerEnv('NEXT_PUBLIC_ADMIN_PASS_SALT') ?? '',
  iteraciones: 210000,
} as const;

/** Duración de la sesión del panel, en horas (modo sin backend). */
export const ADMIN_SESION_HORAS = 12;

/** Umbral de "stock bajo" (unidades) usado en tienda y panel. */
export const UMBRAL_STOCK_BAJO = 8;

/** Claves de localStorage. Centralizadas para no duplicar strings. */
export const CLAVES = {
  /** Estado de la tienda: sucursal elegida + reserva en curso. */
  estado: 'fr_estado',
  /** "Ya elegí dónde retiro": evita repetir el modal de ubicación. */
  ubicacion: 'fr_ubicacion',
  /** Catálogo editado desde el panel (solo modo sin backend). */
  productos: 'fr_admin_productos',
  /** Sucursales editadas desde el panel (solo modo sin backend). */
  sucursales: 'fr_admin_sucursales',
  /** Historial de reservas enviadas (modo sin backend). */
  pedidos: 'fr_admin_pedidos',
  /** Sesión del panel (modo sin backend). */
  sesion: 'fr_admin_sesion',
  /** Copia del último catálogo servido por la API (primer pintado rápido). */
  cache: 'fr_cache_catalogo',
} as const;
