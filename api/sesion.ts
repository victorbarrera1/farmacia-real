import {
  accesoDeClave, authConfigurada, cookieBorrada, cookieSesion, COOKIE, crearToken,
  permitirIntento, tokenValido,
} from './_lib/auth.ts';
import { fallo, metodoNoPermitido, ok, servir, type Peticion } from './_lib/http.ts';

/* ================================================================
   /api/sesion — autenticación del panel.
     GET    → ¿hay sesión válida? y con qué alcance
     POST   → login: { clave, sucursalId? } → cookie HttpOnly firmada
     DELETE → logout: borra la cookie

   `sucursalId` es opcional: en blanco se prueba la clave del admin global y
   las de todas las sucursales. La clave nunca se compara en el navegador.
   ================================================================ */
export default servir(async (p: Peticion) => {
  if (!authConfigurada()) {
    return fallo(503, 'Autenticación no configurada en el servidor', { configurar: true });
  }

  if (p.metodo === 'GET') {
    const s = tokenValido(p.cookies[COOKIE]);
    return ok({
      autorizado: s.valido,
      exp: s.valido ? s.exp : 0,
      admin: s.valido && s.admin,
      sucursalId: s.valido ? s.sucursalId : '',
    });
  }

  if (p.metodo === 'DELETE') {
    return ok({ autorizado: false }, { 'Set-Cookie': cookieBorrada(p) });
  }

  if (p.metodo !== 'POST') return metodoNoPermitido(['GET', 'POST', 'DELETE']);

  if (!(await permitirIntento(p.ip))) {
    return fallo(429, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
  }

  const cuerpo = (p.cuerpo ?? {}) as { clave?: unknown; sucursalId?: unknown };
  const clave = cuerpo.clave;
  if (typeof clave !== 'string' || !clave) return fallo(400, 'Falta la clave');
  const sucursalId = typeof cuerpo.sucursalId === 'string' && cuerpo.sucursalId
    ? cuerpo.sucursalId
    : undefined;

  const acceso = await accesoDeClave(clave, sucursalId);
  if (!acceso) return fallo(401, 'Clave incorrecta');

  const { token, exp } = crearToken(acceso);
  return ok(
    { autorizado: true, exp, admin: acceso.admin, sucursalId: acceso.admin ? '' : acceso.sucursalId },
    { 'Set-Cookie': cookieSesion(p, token) },
  );
});
