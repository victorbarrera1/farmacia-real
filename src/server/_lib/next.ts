import { NextResponse, type NextRequest } from 'next/server';
import { fallo, type Handler, type Peticion, type Respuesta } from './http.ts';

/* ================================================================
   ADAPTADOR NEXT.JS — convierte una petición de NextRequest en la
   Peticion propia (la misma que usa el driver Node de servir) y
   la respuesta en un NextResponse JSON sin caché.
   ----------------------------------------------------------------
   Los handlers viven en src/server/api como funciones puras
   Peticion → Respuesta; las rutas de App Router (app/api) son las
   que se exportan en cada route.ts.
   ================================================================ */

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

export function servirNext(handler: Handler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let cuerpo: unknown = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        cuerpo = await req.json();
      } catch {
        cuerpo = null;
      }
    }

    const cabeceras: Record<string, string> = {};
    req.headers.forEach((v, k) => { cabeceras[k] = v; });
    const reenviada = cabeceras['x-forwarded-for'] ?? '';

    const p: Peticion = {
      metodo: (req.method ?? 'GET').toUpperCase(),
      ruta: req.nextUrl.pathname,
      parametros: req.nextUrl.searchParams,
      cookies: parsearCookies(req.headers.get('cookie') ?? undefined),
      cabeceras,
      ip: (reenviada.split(',')[0] || req.headers.get('x-real-ip') || '0.0.0.0').trim(),
      cuerpo,
    };

    let r: Respuesta;
    try {
      r = await handler(p);
    } catch (e) {
      console.error('[api] error no controlado:', e);
      r = fallo(500, 'Error interno');
    }

    const res = NextResponse.json(r.datos, { status: r.estado });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    Object.entries(r.cabeceras ?? {}).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((x) => res.headers.append(k, x));
      else res.headers.set(k, v);
    });
    return res;
  };
}
