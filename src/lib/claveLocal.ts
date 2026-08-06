import { CLAVE_LOCAL } from '../config';

/* ================================================================
   Verificación de la clave en el navegador (modo SIN backend).
   ----------------------------------------------------------------
   Compara PBKDF2-SHA256(clave, sal) contra el hash de configuración, con
   los mismos parámetros que usa `npm run clave`.

   ⚠️ Esto NO es control de acceso: quien abra las DevTools puede saltarlo.
   Su único mérito es que la clave no viaja en texto plano en el bundle.
   El control real es la API (`POST /api/sesion`), que compara contra un
   hash scrypt que vive solo en el servidor.
   ================================================================ */

const hexABytes = (hex: string): Uint8Array<ArrayBuffer> => {
  const pares = hex.match(/.{1,2}/g) ?? [];
  const bytes = new Uint8Array(new ArrayBuffer(pares.length));
  pares.forEach((par, i) => { bytes[i] = parseInt(par, 16); });
  return bytes;
};

const bytesAHex = (b: ArrayBuffer): string =>
  [...new Uint8Array(b)].map((n) => n.toString(16).padStart(2, '0')).join('');

/** ¿Está habilitado el modo sin backend? */
export const hayClaveLocal = (): boolean => CLAVE_LOCAL.hash.length >= 32;

/** Comparación en tiempo constante (evita filtrar el prefijo correcto). */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

export async function claveLocalCorrecta(clave: string): Promise<boolean> {
  if (!hayClaveLocal() || !clave) return false;
  try {
    const material = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(clave),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: hexABytes(CLAVE_LOCAL.sal),
        iterations: CLAVE_LOCAL.iteraciones,
      },
      material,
      256,
    );
    return iguales(bytesAHex(bits), CLAVE_LOCAL.hash);
  } catch {
    return false;
  }
}
