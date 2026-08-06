import {
  authConfigurada, claveCorrecta, cookieBorrada, cookieSesion, COOKIE, crearToken,
  permitirIntento, tokenValido,
} from './_lib/auth.ts';
import { fallo, metodoNoPermitido, ok, servir, type Peticion } from './_lib/http.ts';

/* ================================================================
   /api/sesion — autenticación del panel.
     GET    → ¿hay sesión válida?
     POST   → login: { clave } → cookie HttpOnly firmada
     DELETE → logout: borra la cookie
   La clave nunca se compara en el navegador ni viaja en el bundle.
   ================================================================ */
export default servir(async (p: Peticion) => {
  if (!authConfigurada()) {
    return fallo(503, 'Autenticación no configurada en el servidor', { configurar: true });
  }

  if (p.metodo === 'GET') {
    const { valido, exp } = tokenValido(p.cookies[COOKIE]);
    return ok({ autorizado: valido, exp: valido ? exp : 0 });
  }

  if (p.metodo === 'DELETE') {
    return ok({ autorizado: false }, { 'Set-Cookie': cookieBorrada(p) });
  }

  if (p.metodo !== 'POST') return metodoNoPermitido(['GET', 'POST', 'DELETE']);

  if (!(await permitirIntento(p.ip))) {
    return fallo(429, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
  }

  const clave = (p.cuerpo as { clave?: unknown } | null)?.clave;
  if (typeof clave !== 'string' || !clave) return fallo(400, 'Falta la clave');
  if (!(await claveCorrecta(clave))) return fallo(401, 'Clave incorrecta');

  const { token, exp } = crearToken();
  return ok({ autorizado: true, exp }, { 'Set-Cookie': cookieSesion(p, token) });
});
