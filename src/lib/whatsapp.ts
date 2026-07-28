import type { Pedido, Producto, Sucursal } from '../types';
import { clp } from './format';
import { stockDe, otrosLocalesCon } from './stock';
import { itemsPedido, totalPedido } from './pedido';

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
  t += `💊 *${p.n}* — ${p.pres}\n${p.lab} · ${clp(p.p)} referencial\n`;
  if (p.rec) t += `📄 Sé que requiere receta médica.\n`;
  t += `\n📍 Sucursal: *${suc.nombre}* (${suc.direccion})\n`;
  if (u > 0) return t + `\n¿Me lo pueden apartar?`;

  const disp = otrosLocalesCon(p, suc.id);
  t += disp.length
    ? `\nEn la web aparece sin stock acá, pero sí en ${disp.map((x) => x.s.nombre).join(' y ')}.\n¿Me lo pueden apartar allá o traerlo a ${suc.nombre}?`
    : `\nEn la web aparece sin stock. ¿Cuándo les llega o me lo pueden pedir?`;
  return t;
}

/** Mensaje con el pedido completo. */
export function msgPedido(pedido: Pedido, suc: Sucursal): string {
  const items = itemsPedido(pedido);
  if (!items.length) return msgGeneral(suc);

  let t = `¡Hola Farmacias Real! 👋\nVi su página web y quiero hacer este pedido:\n\n`;
  items.forEach(({ p, c }) => {
    t += `• *${p.n}* — ${p.pres}\n  ${c} ${c === 1 ? 'unidad' : 'unidades'} · ${clp(p.p * c)}`;
    if (p.rec) t += ` · 📄 requiere receta`;
    if (stockDe(p, suc.id) === 0) t += ` · ⚠️ aparece sin stock en la web`;
    t += `\n`;
  });
  t += `\n💰 Total referencial: *${clp(totalPedido(pedido))}*\n`;
  t += `📍 Retiro en sucursal *${suc.nombre}*\n${suc.direccion}\n`;
  if (items.some(({ p }) => p.rec)) t += `\n📄 Llevo la receta médica al retirar.`;
  t += `\n\n¿Me confirman disponibilidad y valor final? ¡Gracias!`;
  return t;
}
