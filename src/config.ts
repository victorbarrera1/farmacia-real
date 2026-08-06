/* ================================================================
   CONFIGURACIÓN — un solo lugar para claves y ajustes de operación.
   ================================================================ */

/**
 * Clave de acceso al panel (/panel).
 *
 * ⚠️ AVISO DE SEGURIDAD: esta validación es 100% en el navegador, por lo que
 * la clave viaja en el bundle y cualquiera puede leerla en el código fuente.
 * Sirve para evitar entradas accidentales, NO como control de acceso real.
 * Cuando exista backend hay que mover la autenticación al servidor.
 *
 * TODO(api): reemplazar por POST /api/admin/login + cookie httpOnly / JWT.
 */
export const ADMIN_PASS = 'real2025';

/** Duración de la sesión del panel, en horas. */
export const ADMIN_SESION_HORAS = 12;

/** Umbral de "stock bajo" (unidades) usado en tienda y panel. */
export const UMBRAL_STOCK_BAJO = 8;

/** Claves de localStorage. Centralizadas para no duplicar strings. */
export const CLAVES = {
  /** Estado de la tienda: sucursal elegida + pedido en curso. */
  estado: 'fr_estado',
  /** Catálogo editado desde el panel. */
  productos: 'fr_admin_productos',
  /** Sucursales editadas desde el panel. */
  sucursales: 'fr_admin_sucursales',
  /** Historial local de pedidos enviados por WhatsApp. */
  pedidos: 'fr_admin_pedidos',
  /** Sesión del panel. */
  sesion: 'fr_admin_sesion',
} as const;
