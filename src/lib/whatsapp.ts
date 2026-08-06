import type { Pedido, Producto, Sucursal } from '../types';
import { clp } from './format';
import { stockDe, otrosLocalesCon, precioDe } from './stock';
import { itemsPedido, totalPedido } from './pedido';

/* ================================================================
   Mensajes de WhatsApp.
   El sitio NO vende en línea: acá se arma una *reserva* de stock para
   retiro presencial. Los textos lo dicen explícitamente para no inducir
   a error (pago y entrega presenciales; receta validada en el local).
   ================================================================ */

/** Enlace wa.me con texto pre-cargado hacia el WhatsApp de la sucursal. */
export const waLink = (texto: string, suc: Sucursal): string =>
  'https://wa.me/' + suc.whatsapp + '?text=' + encodeURIComponent(texto);

/** Mensaje genérico de consulta. */
export function msgGeneral(suc: Sucursal): string {
  return `¡Hola Farmacias Real! 👋\nVi su página web y quiero hacer una consulta sobre la sucursal *${suc.nombre}* (${suc.direccion}).`;
}

/** Mensaje para consultar por un producto puntual. */
export function msgProducto(p: Producto, suc: Sucursal): string {
  const u = stockDe(p, suc.id);
  let t = `¡Hola Farmacias Real! 👋\nVi su página web y quiero consultar por:\n\n`;
  t += `💊 *${p.n}* — ${p.pres}\n${p.lab}`;
  /* Para productos con receta no reforzamos el precio: la información debe
     ser neutral (publicidad de medicamentos con receta está restringida). */
  if (!p.rec) t += ` · ${clp(precioDe(p, suc.id))} referencial`;
  t += `\n`;
  if (p.rec) t += `📄 Sé que requiere receta médica y la presento en el local.\n`;
  t += `\n📍 Sucursal: *${suc.nombre}* (${suc.direccion})\n`;
  if (u > 0) return t + `\n¿Me lo pueden reservar para retirarlo y pagarlo en el local?`;

  const disp = otrosLocalesCon(p, suc.id);
  t += disp.length
    ? `\nEn la web aparece sin stock acá, pero sí en ${disp.map((x) => x.s.nombre).join(' y ')}.\n¿Me lo pueden apartar allá o traerlo a ${suc.nombre}?`
    : `\nEn la web aparece sin stock. ¿Cuándo les llega o me lo pueden pedir?`;
  return t;
}

/** Mensaje con la reserva completa (cotización para retiro en tienda). */
export function msgPedido(pedido: Pedido, suc: Sucursal): string {
  const items = itemsPedido(pedido, suc.id);
  if (!items.length) return msgGeneral(suc);

  let t = `¡Hola Farmacias Real! 👋\nVi su página web y quiero *cotizar y reservar* estos productos para retirarlos en el local:\n\n`;
  items.forEach(({ p, c, precio }) => {
    t += `• *${p.n}* — ${p.pres}\n  ${c} ${c === 1 ? 'unidad' : 'unidades'}`;
    if (!p.rec) t += ` · ${clp(precio * c)}`;
    if (p.rec) t += ` · 📄 requiere receta`;
    if (stockDe(p, suc.id) === 0) t += ` · ⚠️ aparece sin stock en la web`;
    t += `\n`;
  });
  t += `\n💰 Total referencial: *${clp(totalPedido(pedido, suc.id))}* (se confirma en caja)\n`;
  t += `📍 Retiro y pago presencial en la sucursal *${suc.nombre}*\n${suc.direccion}\n`;

  /* Si algo falta acá pero sí está en otro local, lo proponemos derecho. */
  const enOtro = items
    .filter(({ p }) => stockDe(p, suc.id) === 0 && otrosLocalesCon(p, suc.id).length > 0)
    .map(({ p }) => `${p.n} (${otrosLocalesCon(p, suc.id).map((x) => x.s.corto).join(' / ')})`);
  if (enOtro.length) {
    t += `\nSegún la web, esto no está en ${suc.corto} pero sí en otro local:\n`;
    enOtro.forEach((linea) => { t += `– ${linea}\n`; });
    t += `¿Me lo apartan allá o lo traen a ${suc.corto}?\n`;
  }

  if (items.some(({ p }) => p.rec)) {
    t += `\n📄 Llevo la receta médica vigente para que la revise el Químico Farmacéutico.`;
  }
  t += `\n\nEntiendo que no es una compra en línea: el pago y la entrega son en el local.\n¿Me confirman disponibilidad y valor final? ¡Gracias!`;
  return t;
}
