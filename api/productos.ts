import { almacen } from './_lib/almacen.ts';
import { exigirAcceso, exigirAdmin } from './_lib/auth.ts';
import { escribirCatalogo, leerCatalogo } from './_lib/datos.ts';
import { fallo, metodoNoPermitido, ok, servir, type Peticion } from './_lib/http.ts';
import { fusionarLocal, quitarProducto, upsertProducto } from '../src/lib/dominio.ts';

/* ================================================================
   /api/productos
     GET    → público: lista de productos
     PUT    → admin global: crea o actualiza el producto completo.
              Encargado de sucursal: solo su posición de `st`, `vis` y `px`
              de un producto que ya existe (no puede crear ni renombrar).
     DELETE → solo admin global (?id=<id>)
   ================================================================ */
export default servir(async (p: Peticion) => {
  const a = almacen();

  if (p.metodo === 'GET') {
    const c = await leerCatalogo(a);
    return ok({ productos: c.productos, version: c.version });
  }

  if (p.metodo === 'PUT') {
    const guardia = exigirAcceso(p);
    if (!guardia.ok) return guardia.respuesta;
    if (!a) return fallo(503, 'Almacén no configurado', { configurar: true });

    const actual = await leerCatalogo(a);

    if (guardia.acceso.admin) {
      const siguiente = upsertProducto(actual, p.cuerpo);
      if (siguiente === actual) return fallo(400, 'Producto inválido: falta id o nombre');
      const guardado = await escribirCatalogo(a, siguiente);
      return ok({ productos: guardado.productos, version: guardado.version });
    }

    const idx = actual.sucursales.findIndex((s) => s.id === guardia.acceso.sucursalId);
    if (idx < 0) return fallo(403, 'Tu sucursal ya no existe');
    const siguiente = fusionarLocal(actual, p.cuerpo, idx);
    if (siguiente === actual) {
      return fallo(404, 'Producto no encontrado: un encargado de local no puede crearlos');
    }
    const guardado = await escribirCatalogo(a, siguiente);
    return ok({ productos: guardado.productos, version: guardado.version, alcance: 'sucursal' });
  }

  if (p.metodo !== 'DELETE') return metodoNoPermitido(['GET', 'PUT', 'DELETE']);

  const noAutorizado = exigirAdmin(p);
  if (noAutorizado) return noAutorizado;
  if (!a) return fallo(503, 'Almacén no configurado', { configurar: true });

  const id = p.parametros.get('id') ?? '';
  if (!id) return fallo(400, 'Falta el parámetro id');
  const actual = await leerCatalogo(a);
  const siguiente = quitarProducto(actual, id);
  if (siguiente === actual) return fallo(404, 'Producto no encontrado');
  const guardado = await escribirCatalogo(a, siguiente);
  return ok({ productos: guardado.productos, version: guardado.version });
});
