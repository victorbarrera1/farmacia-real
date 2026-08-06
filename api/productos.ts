import { almacen } from './_lib/almacen.ts';
import { exigirAdmin } from './_lib/auth.ts';
import { escribirCatalogo, leerCatalogo } from './_lib/datos.ts';
import { fallo, metodoNoPermitido, ok, servir, type Peticion } from './_lib/http.ts';
import { quitarProducto, upsertProducto } from '../src/lib/dominio.ts';

/* ================================================================
   /api/productos
     GET    → público: lista de productos
     PUT    → admin: crea o actualiza un producto (upsert por id)
     DELETE → admin: ?id=<id>
   El stock se ajusta en /api/stock; acá `st` se acepta completo para el
   formulario de alta/edición del panel.
   ================================================================ */
export default servir(async (p: Peticion) => {
  const a = almacen();

  if (p.metodo === 'GET') {
    const c = await leerCatalogo(a);
    return ok({ productos: c.productos, version: c.version });
  }

  if (p.metodo !== 'PUT' && p.metodo !== 'DELETE') {
    return metodoNoPermitido(['GET', 'PUT', 'DELETE']);
  }

  const noAutorizado = exigirAdmin(p);
  if (noAutorizado) return noAutorizado;
  if (!a) return fallo(503, 'Almacén no configurado', { configurar: true });

  const actual = await leerCatalogo(a);

  if (p.metodo === 'PUT') {
    const siguiente = upsertProducto(actual, p.cuerpo);
    if (siguiente === actual) return fallo(400, 'Producto inválido: falta id o nombre');
    const guardado = await escribirCatalogo(a, siguiente);
    return ok({ productos: guardado.productos, version: guardado.version });
  }

  const id = p.parametros.get('id') ?? '';
  if (!id) return fallo(400, 'Falta el parámetro id');
  const siguiente = quitarProducto(actual, id);
  if (siguiente === actual) return fallo(404, 'Producto no encontrado');
  const guardado = await escribirCatalogo(a, siguiente);
  return ok({ productos: guardado.productos, version: guardado.version });
});
