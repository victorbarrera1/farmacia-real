import { useCallback, useEffect, useState } from 'react';
import { ADMIN_SESION_HORAS, CLAVES } from '../../config';
import { ErrorApi, capacidades, pedir, reiniciarCapacidades } from '../../lib/api';
import { claveLocalCorrecta, hayClaveLocal } from '../../lib/claveLocal';

/* ================================================================
   SESIÓN DEL PANEL
   ----------------------------------------------------------------
   · Modo `api` (recomendado): la clave se valida en el servidor
     (POST /api/sesion) y la sesión vive en una cookie HttpOnly firmada,
     que el JavaScript de la página no puede leer.
   · Modo `local` (sin backend): se compara un hash PBKDF2 en el navegador
     y la sesión queda en localStorage. No es control de acceso real; el
     panel lo advierte en pantalla.
   ================================================================ */

export type ModoSesion = 'api' | 'local' | 'sin-configurar';

/** Alcance de la sesión: admin global o encargado de una sucursal. */
export interface Alcance {
  admin: boolean;
  /** Vacío cuando es admin global. */
  sucursalId: string;
}

interface SesionLocal {
  /** Marca de tiempo (ms) en que expira la sesión. */
  exp: number;
}

function leerSesionLocal(): boolean {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVES.sesion) || 'null') as SesionLocal | null;
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

function guardarSesionLocal(): void {
  try {
    const exp = Date.now() + ADMIN_SESION_HORAS * 3600_000;
    localStorage.setItem(CLAVES.sesion, JSON.stringify({ exp } satisfies SesionLocal));
  } catch {
    /* modo privado: la sesión durará mientras viva la pestaña */
  }
}

function borrarSesionLocal(): void {
  try {
    localStorage.removeItem(CLAVES.sesion);
  } catch {
    /* nada que hacer */
  }
}

export interface EstadoSesion {
  /** null mientras se consulta al servidor. */
  autorizado: boolean | null;
  modo: ModoSesion;
  /** Con qué permisos entró (null si aún no entra). */
  alcance: Alcance | null;
  /** Sucursales que tienen clave propia, para el selector del login. */
  sucursalesConClave: string[];
  /** Intenta entrar. Devuelve un mensaje de error, o null si entró. */
  entrar: (clave: string, sucursalId?: string) => Promise<string | null>;
  salir: () => void;
}

const ADMIN_LOCAL: Alcance = { admin: true, sucursalId: '' };

export function useAdminSesion(): EstadoSesion {
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [modo, setModo] = useState<ModoSesion>('sin-configurar');
  const [alcance, setAlcance] = useState<Alcance | null>(null);
  const [sucursalesConClave, setSucursalesConClave] = useState<string[]>([]);

  /* Al montar: ¿hay backend? ¿hay sesión válida? ¿con qué alcance? */
  useEffect(() => {
    let vivo = true;
    capacidades().then((caps) => {
      if (!vivo) return;
      if (caps.api && caps.auth) {
        setModo('api');
        setSucursalesConClave(caps.sucursalesConClave ?? []);
        setAutorizado(caps.sesion);
        setAlcance(caps.sesion ? { admin: caps.admin, sucursalId: caps.sucursalId } : null);
        return;
      }
      /* Sin backend: el modo local es solo para desarrollo y siempre es admin. */
      const local = hayClaveLocal();
      setModo(local ? 'local' : 'sin-configurar');
      const entrada = local && leerSesionLocal();
      setAutorizado(entrada);
      setAlcance(entrada ? ADMIN_LOCAL : null);
    });
    return () => { vivo = false; };
  }, []);

  const entrar = useCallback(
    async (clave: string, sucursalId?: string): Promise<string | null> => {
      if (!clave) return 'Escribe la clave.';

      if (modo === 'api') {
        try {
          const r = await pedir<{ admin: boolean; sucursalId: string }>('/api/sesion', {
            metodo: 'POST',
            cuerpo: { clave, sucursalId },
            silencioso: true,
          });
          reiniciarCapacidades();
          setAutorizado(true);
          setAlcance({ admin: r.admin, sucursalId: r.sucursalId });
          return null;
        } catch (e) {
          const err = e instanceof ErrorApi ? e : null;
          if (err?.estado === 401) return 'Clave incorrecta. Intenta de nuevo.';
          if (err?.estado === 429) return 'Demasiados intentos. Espera unos minutos.';
          return err?.mensajeHumano() ?? 'No se pudo validar la clave.';
        }
      }

      if (modo === 'local') {
        if (!(await claveLocalCorrecta(clave))) return 'Clave incorrecta. Intenta de nuevo.';
        guardarSesionLocal();
        setAutorizado(true);
        setAlcance(ADMIN_LOCAL);
        return null;
      }

      return 'El acceso al panel no está configurado en este despliegue.';
    },
    [modo],
  );

  const salir = useCallback(() => {
    borrarSesionLocal();
    setAutorizado(false);
    setAlcance(null);
    if (modo === 'api') {
      pedir('/api/sesion', { metodo: 'DELETE', silencioso: true })
        .catch(() => undefined)
        .finally(() => reiniciarCapacidades());
    }
  }, [modo]);

  return { autorizado, modo, alcance, sucursalesConClave, entrar, salir };
}
