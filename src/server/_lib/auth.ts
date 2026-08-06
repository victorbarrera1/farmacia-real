import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { almacen } from './almacen.ts';
import { fallo, type Peticion, type Respuesta } from './http.ts';

const scrypt = promisify(scryptCb) as (
  clave: string | Buffer,
  sal: string | Buffer,
  largo: number,
  opciones: { N: number; r: number; p: number },
) => Promise<Buffer>;

/* ================================================================
   AUTENTICACIÓN DEL PANEL — de verdad, en el servidor.
   ----------------------------------------------------------------
   Dos niveles de acceso:

   · ADMIN GLOBAL (`ADMIN_PASS_HASH`): puede todo.
   · ENCARGADO DE SUCURSAL (`SUCURSAL_PASS_HASHES`, JSON
     `{ "<sucursalId>": "scrypt:…" }`): solo su local — stock, precio y
     visibilidad de su posición, y los pedidos de su sucursal.

   · La clave nunca viaja al bundle: en el servidor solo vive su hash scrypt.
   · La sesión es un token `exp.alcance.firma` (HMAC-SHA256 con
     ADMIN_SESSION_SECRET) en una cookie HttpOnly + SameSite=Lax (+ Secure en
     https): JavaScript del navegador no puede leerla ni robarla por XSS.
   · Límite de intentos por IP para frenar fuerza bruta.

   Generar los valores:  npm run clave
   ================================================================ */

export const COOKIE = 'fr_sesion';
const HORAS_SESION = 12;
const MAX_INTENTOS = 10;
const VENTANA_SEGUNDOS = 15 * 60;

/** Alcance de una sesión. `sucursalId` vacío = admin global. */
export interface Acceso {
  admin: boolean;
  sucursalId: string;
}

/** ¿Está la autenticación configurada en el servidor? */
export const authConfigurada = (): boolean =>
  !!process.env.ADMIN_PASS_HASH && !!process.env.ADMIN_SESSION_SECRET;

/** Hashes por sucursal declarados en el entorno. */
export function hashesSucursal(): Record<string, string> {
  try {
    const g = JSON.parse(process.env.SUCURSAL_PASS_HASHES ?? '{}') as Record<string, unknown>;
    const out: Record<string, string> = {};
    Object.entries(g).forEach(([id, hash]) => {
      if (typeof hash === 'string' && hash.startsWith('scrypt')) out[id] = hash;
    });
    return out;
  } catch {
    return {};
  }
}

/** Ids de sucursal que tienen clave propia (para el selector del login). */
export const sucursalesConClave = (): string[] => Object.keys(hashesSucursal());

/* --------------------------- la clave -------------------------- */

/**
 * Compara contra un hash con formato `scrypt:N:r:p:sal_hex:hash_hex`.
 * Se usa `:` y no `$` porque los cargadores de `.env` (dotenv-expand, que usa
 * Vite) interpretan `$algo` como interpolación y mutilarían el hash. Se sigue
 * aceptando el formato con `$` por compatibilidad.
 */
async function coincide(clave: string, guardado: string): Promise<boolean> {
  const [algo, N, r, p, salHex, hashHex] = (guardado ?? '').split(/[:$]/);
  if (algo !== 'scrypt' || !salHex || !hashHex) return false;

  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = await scrypt(clave, Buffer.from(salHex, 'hex'), esperado.length, {
    N: Number(N) || 16384,
    r: Number(r) || 8,
    p: Number(p) || 1,
  });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/**
 * Resuelve el alcance de una clave: admin global, encargado de sucursal, o
 * null si no coincide con ninguna. Si se indica `sucursalId`, solo se prueba
 * esa (y el admin global, que entra en cualquier alcance).
 */
export async function accesoDeClave(clave: string, sucursalId?: string): Promise<Acceso | null> {
  if (await coincide(clave, process.env.ADMIN_PASS_HASH ?? '')) {
    return { admin: true, sucursalId: sucursalId ?? '' };
  }
  const hashes = hashesSucursal();
  const candidatos = sucursalId ? [sucursalId] : Object.keys(hashes);
  for (const id of candidatos) {
    if (hashes[id] && (await coincide(clave, hashes[id]))) return { admin: false, sucursalId: id };
  }
  return null;
}

/** Genera el valor de un hash para una clave dada (lo usa el script). */
export async function hashDeClave(clave: string): Promise<string> {
  const N = 16384, r = 8, p = 1;
  const sal = randomBytes(16);
  const hash = await scrypt(clave, sal, 32, { N, r, p });
  return `scrypt:${N}:${r}:${p}:${sal.toString('hex')}:${hash.toString('hex')}`;
}

/* -------------------------- la sesión -------------------------- */

const base64url = (b: Buffer): string => b.toString('base64url');

const firma = (mensaje: string): string =>
  base64url(createHmac('sha256', process.env.ADMIN_SESSION_SECRET ?? '').update(mensaje).digest());

/** Token de sesión: `<vencimiento_ms>.<alcance>.<firma>`. */
export function crearToken(acceso: Acceso, horas = HORAS_SESION): { token: string; exp: number } {
  const exp = Date.now() + horas * 3600_000;
  const alcance = acceso.admin ? '' : acceso.sucursalId;
  const cuerpo = `${exp}.${alcance}`;
  return { token: `${cuerpo}.${firma(cuerpo)}`, exp };
}

export interface Sesion {
  valido: boolean;
  exp: number;
  /** Vacío = admin global. */
  sucursalId: string;
  admin: boolean;
}

export function tokenValido(token: string | undefined): Sesion {
  const invalido: Sesion = { valido: false, exp: 0, sucursalId: '', admin: false };
  if (!token) return invalido;

  const partes = token.split('.');
  if (partes.length !== 3) return invalido;
  const [expTexto, alcance, dada] = partes;
  const cuerpo = `${expTexto}.${alcance}`;

  const esperada = Buffer.from(firma(cuerpo));
  const recibida = Buffer.from(dada);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return invalido;

  const exp = Number(expTexto);
  if (!Number.isFinite(exp) || Date.now() > exp) return invalido;
  return { valido: true, exp, sucursalId: alcance, admin: alcance === '' };
}

const seguro = (p: Peticion): boolean =>
  !!process.env.VERCEL || (p.cabeceras['x-forwarded-proto'] ?? '').includes('https');

export function cookieSesion(p: Peticion, token: string, horas = HORAS_SESION): string {
  const partes = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.round(horas * 3600)}`,
  ];
  if (seguro(p)) partes.push('Secure');
  return partes.join('; ');
}

export function cookieBorrada(p: Peticion): string {
  const partes = [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (seguro(p)) partes.push('Secure');
  return partes.join('; ');
}

/* ------------------------- guardianes -------------------------- */

/** Resultado de un guardián: el alcance concedido o la respuesta de error. */
export type Guardia = { ok: true; acceso: Acceso } | { ok: false; respuesta: Respuesta };

/** Exige una sesión válida (admin global o encargado de sucursal). */
export function exigirAcceso(p: Peticion): Guardia {
  if (!authConfigurada()) {
    return {
      ok: false,
      respuesta: fallo(503, 'Autenticación no configurada en el servidor', { configurar: true }),
    };
  }
  const sesion = tokenValido(p.cookies[COOKIE]);
  if (!sesion.valido) return { ok: false, respuesta: fallo(401, 'Sesión no válida o expirada') };
  return { ok: true, acceso: { admin: sesion.admin, sucursalId: sesion.sucursalId } };
}

/** Exige admin global. Devuelve la respuesta de error, o null si puede pasar. */
export function exigirAdmin(p: Peticion): Respuesta | null {
  const g = exigirAcceso(p);
  if (!g.ok) return g.respuesta;
  if (!g.acceso.admin) {
    return fallo(403, 'Esta acción es solo del administrador general');
  }
  return null;
}

/** Límite de intentos de login por IP. `true` = seguir; `false` = bloquear. */
export async function permitirIntento(ip: string): Promise<boolean> {
  const a = almacen();
  if (!a) return true; /* sin almacén no hay contador; el hash sigue protegiendo */
  try {
    const n = await a.contar(`intentos:${ip}`, VENTANA_SEGUNDOS);
    return n <= MAX_INTENTOS;
  } catch {
    return true; /* no dejamos que un fallo del almacén bloquee el acceso */
  }
}
