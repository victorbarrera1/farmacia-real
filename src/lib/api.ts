/* ================================================================
   CLIENTE DE LA API
   ----------------------------------------------------------------
   El sitio funciona con o sin backend:

   · Si `/api/estado` responde, la tienda y el panel trabajan contra la
     API (datos compartidos entre dispositivos, clave validada en el
     servidor, cookie HttpOnly).
   · Si no responde (o no está configurado el almacén), todo sigue
     funcionando en modo local con localStorage, como hasta ahora.

   Así el deploy nunca queda a medias: sin variables de entorno el sitio
   se comporta igual que antes.
   ================================================================ */

export type TipoAlmacen = 'kv' | 'archivo' | 'sin-configurar';

export interface Capacidades {
  /** ¿Contestan las funciones serverless? */
  api: boolean;
  almacen: TipoAlmacen;
  /** ¿Puede el servidor validar la clave del panel? */
  auth: boolean;
  /** ¿Hay una sesión válida ahora mismo? */
  sesion: boolean;
  /** ¿Esa sesión es del administrador general? */
  admin: boolean;
  /** Sucursal de la sesión (vacío = admin global). */
  sucursalId: string;
  /** Sucursales con clave propia, para el selector del login. */
  sucursalesConClave: string[];
}

export const SIN_API: Capacidades = {
  api: false,
  almacen: 'sin-configurar',
  auth: false,
  sesion: false,
  admin: false,
  sucursalId: '',
  sucursalesConClave: [],
};

/** Error de la API con el código HTTP, para distinguir 401 de 503. */
export class ErrorApi extends Error {
  estado: number;
  /** true cuando falta configurar el backend (503). */
  configurar: boolean;

  constructor(mensaje: string, estado: number, configurar = false) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.configurar = configurar;
  }

  /** Mensaje listo para mostrarle a una persona en el panel. */
  mensajeHumano(): string {
    if (this.estado === 0) return 'Sin conexión: los cambios no se guardaron en el servidor.';
    if (this.estado === 401) return 'La sesión expiró. Vuelve a entrar al panel.';
    if (this.estado === 429) return 'Demasiados intentos. Espera unos minutos.';
    if (this.estado === 503) return 'El servidor no tiene el almacén configurado.';
    return this.message;
  }
}

const TIEMPO_LIMITE = 8000;

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  cuerpo?: unknown;
  /** Silencia el log en consola (para sondeos). */
  silencioso?: boolean;
}

/** Llama a la API y devuelve el JSON ya validado. Lanza ErrorApi si falla. */
export async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, silencioso } = opciones;
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      credentials: 'same-origin',
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIEMPO_LIMITE),
    });
  } catch {
    throw new ErrorApi('Sin conexión con el servidor', 0);
  }

  const texto = await respuesta.text();
  let datos: Record<string, unknown> = {};
  try {
    datos = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
  } catch {
    /* Si llega HTML (rewrite de la SPA) es que la función no existe. */
    throw new ErrorApi('La API no está disponible', 404);
  }

  if (!respuesta.ok || datos.ok !== true) {
    const mensaje = typeof datos.error === 'string' ? datos.error : `Error ${respuesta.status}`;
    if (!silencioso && respuesta.status >= 500) console.warn('[api]', ruta, mensaje);
    throw new ErrorApi(mensaje, respuesta.status, datos.configurar === true);
  }
  return datos as T;
}

let sondeo: Promise<Capacidades> | null = null;

/** Capacidades del backend. Se consulta una sola vez por carga de página. */
export function capacidades(): Promise<Capacidades> {
  if (!sondeo) {
    sondeo = pedir<Capacidades & { ok: true }>('/api/estado', { silencioso: true })
      .then((r) => ({
        api: true,
        almacen: r.almacen,
        auth: r.auth,
        sesion: r.sesion,
        admin: r.admin ?? false,
        sucursalId: r.sucursalId ?? '',
        sucursalesConClave: r.sucursalesConClave ?? [],
      }))
      .catch(() => SIN_API);
  }
  return sondeo;
}

/** Olvida el sondeo (después de login/logout, o en pruebas). */
export function reiniciarCapacidades(): void {
  sondeo = null;
}
