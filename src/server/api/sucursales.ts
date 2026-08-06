import { almacen } from '../_lib/almacen.ts';
import { exigirAdmin } from '../_lib/auth.ts';
import { escribirCatalogo, leerCatalogo } from '../_lib/datos.ts';
import { fallo, metodoNoPermitido, ok, type Handler} from '../_lib/http.ts';
import { idSucursalDesde, quitarSucursal, upsertSucursal, whatsappValido } from '../../lib/dominio.ts';

/* ================================================================
   /api/sucursales
     GET    → público: lista de sucursales
     PUT    → admin: crea o actualiza una sucursal. Si no trae id, se
              deriva del nombre. Al crear/eliminar se reindexa el stock de
              todos los productos (invariante de st[]).
     DELETE → admin: ?id=<id>
   ================================================================ */
export const handler: Handler = async (p) => {
  const a = almacen();

  if (p.metodo === 'GET') {
    const c = await leerCatalogo(a);
    return ok({ sucursales: c.sucursales, version: c.version });
  }

  if (p.metodo !== 'PUT' && p.metodo !== 'DELETE') {
    return metodoNoPermitido(['GET', 'PUT', 'DELETE']);
  }

  const noAutorizado = exigirAdmin(p);
  if (noAutorizado) return noAutorizado;
  if (!a) return fallo(503, 'Almacén no configurado', { configurar: true });

  const actual = await leerCatalogo(a);

  if (p.metodo === 'PUT') {
    const entrada = (p.cuerpo ?? {}) as Record<string, unknown>;
    const nombre = typeof entrada.nombre === 'string' ? entrada.nombre : '';
    if (!nombre.trim()) return fallo(400, 'La sucursal necesita nombre');

    const wa = String(entrada.whatsapp ?? '').replace(/\D/g, '');
    if (!whatsappValido(wa)) {
      return fallo(400, 'WhatsApp inválido: usa 56 + 9 dígitos, sin signos (ej. 56940184554)');
    }

    const id =
      typeof entrada.id === 'string' && entrada.id
        ? entrada.id
        : idSucursalDesde(nombre, actual.sucursales.map((s) => s.id));

    const siguiente = upsertSucursal(actual, { ...entrada, id, whatsapp: wa });
    if (siguiente === actual) return fallo(400, 'Sucursal inválida');
    const guardado = await escribirCatalogo(a, siguiente);
    return ok({
      sucursales: guardado.sucursales,
      productos: guardado.productos,
      version: guardado.version,
    });
  }

  const id = p.parametros.get('id') ?? '';
  if (!id) return fallo(400, 'Falta el parámetro id');
  const siguiente = quitarSucursal(actual, id);
  if (!siguiente) {
    return fallo(409, 'No se puede eliminar: la sucursal no existe o es la única que queda');
  }
  const guardado = await escribirCatalogo(a, siguiente);
  return ok({
    sucursales: guardado.sucursales,
    productos: guardado.productos,
    version: guardado.version,
  });
};
