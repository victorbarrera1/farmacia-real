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
 * La clave en texto plano YA NO vive en el código. Hay dos modos:
 *
 * 1. Con backend (recomendado): `POST /api/sesion` valida la clave contra
 *    el hash scrypt de la variable de entorno `ADMIN_PASS_HASH` y devuelve
 *    una cookie HttpOnly firmada. El navegador nunca ve la clave ni el hash.
 *
 * 2. Sin backend (fallback): se compara un hash PBKDF2 calculado en el
 *    navegador contra `CLAVE_LOCAL_HASH`. Sigue siendo evitable por
 *    cualquiera que sepa abrir las DevTools —no es control de acceso real—
 *    pero al menos la clave no queda legible en el bundle.
 *
 * Generar ambos valores:  npm run clave
 */
export const CLAVE_LOCAL = {
  /**
   * Hash PBKDF2-SHA256 (hex) de la clave provisional actual del panel.
   * Se mantiene para no dejar el panel inaccesible mientras no estén las
   * variables del backend. La clave en texto plano ya NO está en el código.
   *
   * ⚠️ La clave provisional es débil (se venía usando desde la demo): en
   * cuanto el backend esté configurado, cámbiala con `npm run clave` y
   * borra este fallback (o define VITE_ADMIN_PASS_HASH / _SALT).
   */
  hash: ENV.VITE_ADMIN_PASS_HASH
    ?? 'd8fc625f628e342ec41b803475d4f25c0769d9bb9ff40c009b6c286559fb3439',
  /** Sal (hex). Cambiarla invalida el hash. */
  sal: ENV.VITE_ADMIN_PASS_SALT
    ?? '5f2ab8c1d40e93761a2b8c5d0e4f7a63',
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
