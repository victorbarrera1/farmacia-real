import type { IncomingMessage, ServerResponse } from 'node:http';

/* ================================================================
   HTTP — utilidades comunes de las funciones serverless.
   ----------------------------------------------------------------
   Los handlers se escriben con una firma propia y simple
   (`Peticion → Respuesta`) y este módulo los adapta a la firma Node
   que usa Vercel. Así se pueden probar sin levantar un servidor
   (ver pruebas/api.test.mjs) y se montan igual en el dev server de Vite.
   ================================================================ */

export interface Peticion {
  metodo: string;
  /** Path sin query (p. ej. `/api/productos`). */
  ruta: string;
  parametros: URLSearchParams;
  cookies: Record<string, string>;
  cabeceras: Record<string, string>;
  /** IP del cliente, según las cabeceras del proxy de Vercel. */
  ip: string;
  /** Cuerpo ya parseado como JSON (null si no vino o no es JSON válido). */
  cuerpo: unknown;
}

export interface Respuesta {
  estado: number;
  datos: unknown;
  /** Cabeceras extra (p. ej. Set-Cookie). */
  cabeceras?: Record<string, string | string[]>;
}

export type Handler = (p: Peticion) => Promise<Respuesta> | Respuesta;

export const ok = (datos: unknown, cabeceras?: Respuesta['cabeceras']): Respuesta => ({
  estado: 200,
  datos: { ok: true, ...(datos as object) },
  cabeceras,
});

export const fallo = (estado: number, error: string, extra?: object): Respuesta => ({
  estado,
  datos: { ok: false, error, ...extra },
});

/** 405 con la lista de métodos aceptados. */
export const metodoNoPermitido = (permitidos: string[]): Respuesta => ({
  estado: 405,
  datos: { ok: false, error: 'Método no permitido' },
  cabeceras: { Allow: permitidos.join(', ') },
});

function parsearCookies(cabecera: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cabecera) return out;
  cabecera.split(';').forEach((par) => {
    const i = par.indexOf('=');
    if (i < 1) return;
    const k = par.slice(0, i).trim();
    const v = par.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

/** Tope de cuerpo aceptado (1 MB): el catálogo completo cabe de sobra. */
const MAX_CUERPO = 1_000_000;

async function leerCuerpo(req: IncomingMessage): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'HEAD') return null;
  const trozos: Buffer[] = [];
  let total = 0;
  for await (const trozo of req) {
    const b = trozo as Buffer;
    total += b.length;
    if (total > MAX_CUERPO) throw new Error('cuerpo-muy-grande');
    trozos.push(b);
  }
  if (!total) return null;
  try {
    return JSON.parse(Buffer.concat(trozos).toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Adapta un handler propio a la firma Node de Vercel.
 * Devuelve siempre JSON y sin caché (son datos de gestión).
 */
export function servir(handler: Handler) {
  return async function (req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    try {
      const cuerpo = await leerCuerpo(req);
      const cabeceras: Record<string, string> = {};
      Object.entries(req.headers).forEach(([k, v]) => {
        cabeceras[k] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
      });
      const reenviada = cabeceras['x-forwarded-for'] ?? '';

      const p: Peticion = {
        metodo: (req.method ?? 'GET').toUpperCase(),
        ruta: url.pathname,
        parametros: url.searchParams,
        cookies: parsearCookies(req.headers.cookie),
        cabeceras,
        ip: (reenviada.split(',')[0] || req.socket?.remoteAddress || '0.0.0.0').trim(),
        cuerpo,
      };

      const r = await handler(p);
      res.statusCode = r.estado;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      Object.entries(r.cabeceras ?? {}).forEach(([k, v]) => res.setHeader(k, v));
      res.end(JSON.stringify(r.datos));
    } catch (e) {
      const grande = e instanceof Error && e.message === 'cuerpo-muy-grande';
      res.statusCode = grande ? 413 : 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.end(
        JSON.stringify({
          ok: false,
          error: grande ? 'El cuerpo de la petición es demasiado grande' : 'Error interno',
        }),
      );
      if (!grande) console.error('[api] error no controlado:', e);
    }
  };
}
