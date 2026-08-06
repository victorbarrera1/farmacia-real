import { almacen } from './_lib/almacen.ts';
import { exigirAdmin } from './_lib/auth.ts';
import {
  escribirCatalogo, leerCatalogo, restaurarProductos, restaurarSucursales, restaurarTodo,
} from './_lib/datos.ts';
import { fallo, metodoNoPermitido, ok, servir, type Peticion } from './_lib/http.ts';
import { sanearCatalogo } from '../src/lib/dominio.ts';
import { catalogoDeFabrica } from './_lib/datos.ts';

/* ================================================================
   /api/catalogo
     GET  → público: { productos, sucursales, version }  (lo que lee la tienda)
     PUT  → admin: reemplaza el catálogo completo (import CSV / restauración
            de un respaldo). Cuerpo: { productos, sucursales }
     POST → admin: ?accion=restaurar | restaurarProductos | restaurarSucursales
   ================================================================ */
export default servir(async (p: Peticion) => {
  const a = almacen();

  if (p.metodo === 'GET') {
    const c = await leerCatalogo(a);
    return ok({
      productos: c.productos,
      sucursales: c.sucursales,
      version: c.version,
      almacen: a ? a.tipo : 'sin-configurar',
      /** false = lo servido son los datos de fábrica, no hay persistencia. */
      persistente: !!a,
    });
  }

  if (p.metodo !== 'PUT' && p.metodo !== 'POST') {
    return metodoNoPermitido(['GET', 'PUT', 'POST']);
  }

  const noAutorizado = exigirAdmin(p);
  if (noAutorizado) return noAutorizado;
  if (!a) return fallo(503, 'Almacén no configurado', { configurar: true });

  if (p.metodo === 'PUT') {
    const entrada = p.cuerpo as { productos?: unknown; sucursales?: unknown } | null;
    if (!entrada || !Array.isArray(entrada.productos) || !Array.isArray(entrada.sucursales)) {
      return fallo(400, 'Se esperaba { productos: [], sucursales: [] }');
    }
    const limpio = sanearCatalogo({ ...entrada, version: Date.now() }, catalogoDeFabrica());
    if (!limpio.sucursales.length) return fallo(400, 'Debe haber al menos una sucursal');
    const guardado = await escribirCatalogo(a, limpio);
    return ok({ productos: guardado.productos, sucursales: guardado.sucursales, version: guardado.version });
  }

  const accion = p.parametros.get('accion') ?? '';
  const c =
    accion === 'restaurar'
      ? await restaurarTodo(a)
      : accion === 'restaurarProductos'
        ? await restaurarProductos(a)
        : accion === 'restaurarSucursales'
          ? await restaurarSucursales(a)
          : null;
  if (!c) return fallo(400, 'Acción no reconocida');
  return ok({ productos: c.productos, sucursales: c.sucursales, version: c.version });
});
