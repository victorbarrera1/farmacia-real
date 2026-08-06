import { almacen } from './_lib/almacen.ts';
import { authConfigurada, COOKIE, tokenValido } from './_lib/auth.ts';
import { metodoNoPermitido, ok, servir, type Peticion } from './_lib/http.ts';

/* GET /api/estado — qué sabe hacer este backend.
   El cliente lo consulta una vez para decidir si trabaja contra la API o
   cae al modo local (localStorage). Nunca revela secretos. */
export default servir((p: Peticion) => {
  if (p.metodo !== 'GET') return metodoNoPermitido(['GET']);

  const a = almacen();
  return ok({
    api: true,
    version: 1,
    almacen: a ? a.tipo : 'sin-configurar',
    /** true = el servidor puede validar la clave del panel. */
    auth: authConfigurada(),
    sesion: authConfigurada() && tokenValido(p.cookies[COOKIE]).valido,
  });
});
