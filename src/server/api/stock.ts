import { almacen } from '../_lib/almacen.ts';
import { exigirAcceso } from '../_lib/auth.ts';
import { escribirCatalogo, leerCatalogo } from '../_lib/datos.ts';
import { fallo, metodoNoPermitido, ok, type Handler} from '../_lib/http.ts';
import { ajustarStockEn, fijarStockEn } from '../../lib/dominio.ts';

/* ================================================================
   PATCH /api/stock
   Cuerpo: { id, sucursalId | idx, unidades } → fija el valor
           { id, sucursalId | idx, delta }    → suma/resta

   Alcance: el admin global puede tocar cualquier sucursal; el encargado de
   un local, solo la suya (cualquier otra → 403).
   ================================================================ */
export const handler: Handler = async (p) => {
  if (p.metodo !== 'PATCH') return metodoNoPermitido(['PATCH']);

  const guardia = exigirAcceso(p);
  if (!guardia.ok) return guardia.respuesta;
  const { acceso } = guardia;

  const a = almacen();
  if (!a) return fallo(503, 'Almacén no configurado', { configurar: true });

  const cuerpo = (p.cuerpo ?? {}) as Record<string, unknown>;
  const id = typeof cuerpo.id === 'string' ? cuerpo.id : '';
  if (!id) return fallo(400, 'Falta el id del producto');

  const actual = await leerCatalogo(a);

  const idx =
    typeof cuerpo.sucursalId === 'string'
      ? actual.sucursales.findIndex((s) => s.id === cuerpo.sucursalId)
      : Number(cuerpo.idx);
  if (!Number.isInteger(idx) || idx < 0 || idx >= actual.sucursales.length) {
    return fallo(400, 'Sucursal no encontrada (usa sucursalId o un idx válido)');
  }

  if (!acceso.admin && actual.sucursales[idx].id !== acceso.sucursalId) {
    return fallo(403, 'Solo puedes modificar el stock de tu sucursal');
  }
  if (!actual.productos.some((x) => x.id === id)) return fallo(404, 'Producto no encontrado');

  const siguiente =
    cuerpo.delta !== undefined
      ? ajustarStockEn(actual, id, idx, Number(cuerpo.delta))
      : fijarStockEn(actual, id, idx, Number(cuerpo.unidades));

  const guardado = await escribirCatalogo(a, siguiente);
  const producto = guardado.productos.find((x) => x.id === id);
  return ok({ producto, version: guardado.version });
};
