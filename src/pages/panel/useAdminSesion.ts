import { useCallback, useState } from 'react';
import { ADMIN_PASS, ADMIN_SESION_HORAS, CLAVES } from '../../config';

/* ================================================================
   SESIÓN DEL PANEL
   ----------------------------------------------------------------
   Validación en el navegador contra ADMIN_PASS (src/config.ts) y sesión
   con vencimiento guardada en localStorage.

   ⚠️ No es seguridad real: sin backend, la clave está en el bundle.
   TODO(api): POST /api/admin/login y guardar solo el token del servidor.
   ================================================================ */

interface Sesion {
  /** Marca de tiempo (ms) en que expira la sesión. */
  exp: number;
}

function leerSesion(): boolean {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVES.sesion) || 'null') as Sesion | null;
    if (!g || typeof g.exp !== 'number') return false;
    if (Date.now() > g.exp) {
      localStorage.removeItem(CLAVES.sesion);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function useAdminSesion() {
  const [autorizado, setAutorizado] = useState<boolean>(leerSesion);

  /** Intenta iniciar sesión. Devuelve false si la clave no coincide. */
  const entrar = useCallback((clave: string): boolean => {
    if (clave !== ADMIN_PASS) return false;
    try {
      const exp = Date.now() + ADMIN_SESION_HORAS * 3600_000;
      localStorage.setItem(CLAVES.sesion, JSON.stringify({ exp } satisfies Sesion));
    } catch {
      /* modo privado: la sesión durará solo mientras la pestaña viva */
    }
    setAutorizado(true);
    return true;
  }, []);

  const salir = useCallback(() => {
    try {
      localStorage.removeItem(CLAVES.sesion);
    } catch {
      /* nada que hacer */
    }
    setAutorizado(false);
  }, []);

  return { autorizado, entrar, salir };
}
