/* ================================================================
   CONFIGURACIÓN — un solo lugar para claves, URLs y ajustes.
   ================================================================ */

/** URL pública del sitio (canonical, sitemap, JSON-LD, og:url). */
export const SITIO_URL = 'https://farmaciareal.vercel.app';

/* Variables de build. Se lee así (y no `import.meta.env.X` directo) para que
   este archivo también se pueda importar desde Node en los scripts de
   `scripts/` — ahí `import.meta.env` no existe. Vite igual las reemplaza en
   tiempo de build. */
const ENV: Record<string, string | undefined> =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/**
 * ACCESO AL PANEL (/panel)
 * ----------------------------------------------------------------
 * La clave se valida SOLO en el servidor: `POST /api/sesion` la compara
 * contra el hash scrypt de `ADMIN_PASS_HASH` (admin global) o de
 * `SUCURSAL_PASS_HASHES` (encargado de un local) y responde con una cookie
 * HttpOnly firmada. Ni la clave ni su hash viajan en el bundle.
 *
 * El único fallback es para desarrollo sin backend: si se definen
 * `VITE_ADMIN_PASS_HASH` y `VITE_ADMIN_PASS_SALT` en un `.env` local (nunca
 * en producción), el panel compara un PBKDF2 en el navegador. Sin esas
 * variables y sin API, el panel no deja entrar.
 *
 * Generar todos los valores:  npm run clave
 */
export const CLAVE_LOCAL = {
  /** Hash PBKDF2-SHA256 (hex). Vacío = modo sin backend deshabilitado. */
  hash: ENV.VITE_ADMIN_PASS_HASH ?? '',
  /** Sal (hex) del hash anterior. */
  sal: ENV.VITE_ADMIN_PASS_SALT ?? '',
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
