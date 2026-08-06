import { almacen } from './_lib/almacen.ts';
import { exigirAdmin } from './_lib/auth.ts';
import { agregarPedido, borrarPedidos, eliminarPedido, leerPedidos } from './_lib/datos.ts';
import { fallo, metodoNoPermitido, ok, servir, type Peticion } from './_lib/http.ts';

/* ================================================================
   /api/pedidos — historial de reservas enviadas por WhatsApp.
     POST   → público: la tienda registra la reserva que el visitante envió.
              No es una venta ni un pago: es el registro de la cotización.
     GET    → admin: historial completo.
     DELETE → admin: ?id=<id> o ?todos=1
   Sin datos personales: solo productos, cantidades, total y sucursal.
   ================================================================ */
export default servir(async (p: Peticion) => {
  const a = almacen();

  if (p.metodo === 'POST') {
    if (!a) return fallo(503, 'Almacén no configurado', { configurar: true });
    const pedido = await agregarPedido(a, p.cuerpo);
    if (!pedido) return fallo(400, 'Pedido inválido: se esperaba al menos un item con nombre');
    return { estado: 201, datos: { ok: true, pedido } };
  }

  if (p.metodo !== 'GET' && p.metodo !== 'DELETE') {
    return metodoNoPermitido(['GET', 'POST', 'DELETE']);
  }

  const noAutorizado = exigirAdmin(p);
  if (noAutorizado) return noAutorizado;
  if (!a) return fallo(503, 'Almacén no configurado', { configurar: true });

  if (p.metodo === 'GET') return ok({ pedidos: await leerPedidos(a) });

  if (p.parametros.get('todos') === '1') {
    await borrarPedidos(a);
    return ok({ pedidos: [] });
  }
  const id = p.parametros.get('id') ?? '';
  if (!id) return fallo(400, 'Falta el parámetro id (o todos=1)');
  await eliminarPedido(a, id);
  return ok({ pedidos: await leerPedidos(a) });
});
