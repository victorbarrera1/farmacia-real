import { almacen } from '../_lib/almacen.ts';
import { authConfigurada, COOKIE, sucursalesConClave, tokenValido } from '../_lib/auth.ts';
import { metodoNoPermitido, ok, type Handler, type Peticion } from '../_lib/http.ts';

/* GET /api/estado — qué sabe hacer este backend y con qué alcance entró quien
   pregunta. El cliente lo consulta una vez para decidir si trabaja contra la
   API o cae al modo local. Nunca revela secretos ni hashes. */
export const handler: Handler = (p: Peticion) => {
  if (p.metodo !== 'GET') return metodoNoPermitido(['GET']);

  const a = almacen();
  const s = tokenValido(p.cookies[COOKIE]);
  return ok({
    api: true,
    version: 2,
    almacen: a ? a.tipo : 'sin-configurar',
    /** true = el servidor puede validar la clave del panel. */
    auth: authConfigurada(),
    sesion: authConfigurada() && s.valido,
    admin: authConfigurada() && s.valido && s.admin,
    sucursalId: s.valido ? s.sucursalId : '',
    /** Sucursales con clave propia, para el selector del login. */
    sucursalesConClave: authConfigurada() ? sucursalesConClave() : [],
  });
};
