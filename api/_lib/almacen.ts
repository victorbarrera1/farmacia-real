import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/* ================================================================
   ALMACÉN — capa de persistencia con dos drivers.
   ----------------------------------------------------------------
   1) `kv`      → Redis por REST (Vercel KV / Upstash). Es el modo de
                  producción: sin SDK, solo fetch, y funciona en cualquier
                  runtime. Variables: KV_REST_API_URL + KV_REST_API_TOKEN
                  (o UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
   2) `archivo` → JSON en `.data/` para desarrollo y pruebas locales.
                  Solo fuera de Vercel: en serverless el disco es efímero
                  por instancia y daría datos inconsistentes.

   Si no hay ninguno configurado, `almacen()` devuelve null y la API queda
   en modo lectura (sirve los datos de fábrica) para no fingir escrituras.

   Migrar a Postgres/Neon = reimplementar esta interfaz; los handlers y el
   cliente no cambian.
   ================================================================ */

export type TipoAlmacen = 'kv' | 'archivo';

export interface Almacen {
  tipo: TipoAlmacen;
  leer<T>(clave: string): Promise<T | null>;
  escribir(clave: string, valor: unknown): Promise<void>;
  borrar(clave: string): Promise<void>;
  /** Incrementa un contador con vencimiento (para el límite de intentos). */
  contar(clave: string, ttlSegundos: number): Promise<number>;
}

const PREFIJO = 'fr:';

/* --------------------------- Redis REST ------------------------ */

function credencialesKv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '';
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '';
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

function almacenKv(url: string, token: string): Almacen {
  async function comando<T>(...partes: (string | number)[]): Promise<T> {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(partes.map(String)),
    });
    if (!r.ok) throw new Error(`kv ${r.status}: ${await r.text()}`);
    const j = (await r.json()) as { result: T };
    return j.result;
  }

  return {
    tipo: 'kv',
    async leer<T>(clave: string) {
      const bruto = await comando<string | null>('GET', PREFIJO + clave);
      if (bruto === null || bruto === undefined) return null;
      try {
        return JSON.parse(bruto) as T;
      } catch {
        return null;
      }
    },
    async escribir(clave, valor) {
      await comando('SET', PREFIJO + clave, JSON.stringify(valor));
    },
    async borrar(clave) {
      await comando('DEL', PREFIJO + clave);
    },
    async contar(clave, ttlSegundos) {
      const n = await comando<number>('INCR', PREFIJO + clave);
      if (n === 1) await comando('EXPIRE', PREFIJO + clave, ttlSegundos);
      return n;
    },
  };
}

/* ---------------------------- archivo -------------------------- */

function almacenArchivo(base: string): Almacen {
  const ruta = (clave: string) => join(base, `${clave.replace(/[^a-z0-9_-]/gi, '_')}.json`);

  async function leerBruto<T>(clave: string): Promise<T | null> {
    try {
      return JSON.parse(await readFile(ruta(clave), 'utf8')) as T;
    } catch {
      return null;
    }
  }

  async function escribirBruto(clave: string, valor: unknown): Promise<void> {
    const destino = ruta(clave);
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, JSON.stringify(valor, null, 2), 'utf8');
  }

  return {
    tipo: 'archivo',
    leer: leerBruto,
    escribir: escribirBruto,
    async borrar(clave) {
      await rm(ruta(clave), { force: true });
    },
    async contar(clave, ttlSegundos) {
      const g = await leerBruto<{ n: number; exp: number }>(clave);
      const ahora = Date.now();
      const actual = g && g.exp > ahora ? g : { n: 0, exp: ahora + ttlSegundos * 1000 };
      const siguiente = { n: actual.n + 1, exp: actual.exp };
      await escribirBruto(clave, siguiente);
      return siguiente.n;
    },
  };
}

/* ---------------------------- fábrica -------------------------- */

let cache: Almacen | null | undefined;

/** Almacén disponible, o null si no hay ninguno configurado. */
export function almacen(): Almacen | null {
  if (cache !== undefined) return cache;

  const kv = credencialesKv();
  if (kv && process.env.ALMACEN !== 'archivo') {
    cache = almacenKv(kv.url, kv.token);
    return cache;
  }

  const enVercel = !!process.env.VERCEL;
  if (!enVercel || process.env.ALMACEN === 'archivo') {
    cache = almacenArchivo(process.env.ALMACEN_DIR ?? join(process.cwd(), '.data'));
    return cache;
  }

  cache = null;
  return cache;
}

/** Solo para pruebas: olvida el driver memorizado. */
export function reiniciarAlmacen(): void {
  cache = undefined;
}
