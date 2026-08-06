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
   · La clave NUNCA viaja al bundle: en el servidor solo vive su hash
     scrypt en la variable ADMIN_PASS_HASH.
   · La sesión es un token firmado con HMAC-SHA256 (ADMIN_SESSION_SECRET)
     guardado en una cookie HttpOnly + SameSite=Lax (+ Secure en https),
     así que JavaScript del navegador no puede leerla ni robarla por XSS.
   · Límite de intentos por IP para frenar fuerza bruta.

   Generar los valores:  npm run clave
   ================================================================ */

export const COOKIE = 'fr_sesion';
const HORAS_SESION = 12;
const MAX_INTENTOS = 10;
const VENTANA_SEGUNDOS = 15 * 60;

/** ¿Está la autenticación configurada en el servidor? */
export const authConfigurada = (): boolean =>
  !!process.env.ADMIN_PASS_HASH && !!process.env.ADMIN_SESSION_SECRET;

/* --------------------------- la clave -------------------------- */

/**
 * Formato: `scrypt:N:r:p:sal_hex:hash_hex`.
 * Se usa `:` y no `$` porque los cargadores de `.env` (dotenv-expand, que usa
 * Vite) interpretan `$algo` como interpolación de variables y mutilarían el
 * hash. Se sigue aceptando el formato con `$` por compatibilidad.
 */
export async function claveCorrecta(clave: string): Promise<boolean> {
  const guardado = process.env.ADMIN_PASS_HASH ?? '';
  const [algo, N, r, p, salHex, hashHex] = guardado.split(/[:$]/);
  if (algo !== 'scrypt' || !salHex || !hashHex) return false;

  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = await scrypt(clave, Buffer.from(salHex, 'hex'), esperado.length, {
    N: Number(N) || 16384,
    r: Number(r) || 8,
    p: Number(p) || 1,
  });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/** Genera el valor de ADMIN_PASS_HASH para una clave dada (lo usa el script). */
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

/** Token de sesión: `<vencimiento_ms>.<firma>`. */
export function crearToken(horas = HORAS_SESION): { token: string; exp: number } {
  const exp = Date.now() + horas * 3600_000;
  const cuerpo = String(exp);
  return { token: `${cuerpo}.${firma(cuerpo)}`, exp };
}

export function tokenValido(token: string | undefined): { valido: boolean; exp: number } {
  if (!token) return { valido: false, exp: 0 };
  const [cuerpo, dada] = token.split('.');
  if (!cuerpo || !dada) return { valido: false, exp: 0 };

  const esperada = Buffer.from(firma(cuerpo));
  const recibida = Buffer.from(dada);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return { valido: false, exp: 0 };
  }
  const exp = Number(cuerpo);
  if (!Number.isFinite(exp) || Date.now() > exp) return { valido: false, exp: 0 };
  return { valido: true, exp };
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

/** Devuelve una respuesta de error si la petición no es de un admin. */
export function exigirAdmin(p: Peticion): Respuesta | null {
  if (!authConfigurada()) {
    return fallo(503, 'Autenticación no configurada en el servidor', { configurar: true });
  }
  return tokenValido(p.cookies[COOKIE]).valido ? null : fallo(401, 'Sesión no válida o expirada');
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
