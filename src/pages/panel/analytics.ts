import type { PedidoRegistrado } from '../../lib/pedidosLog';

/* ================================================================
   ANALÍTICA DE PEDIDOS — sobre el historial local real.
   ----------------------------------------------------------------
   Antes esto era demanda inventada. Ahora se calcula sobre los pedidos
   que se armaron y enviaron por WhatsApp desde este navegador
   (src/lib/pedidosLog.ts). Si no hay pedidos, los componentes muestran
   "sin datos" en lugar de números falsos.

   TODO(api): reemplazar por eventos reales del backend (ventas, vistas)
   cuando exista: GET /api/metricas/ventas?desde=…
   ================================================================ */

export interface PuntoSerie {
  label: string;
  valor: number;
}

export interface FilaRankingDatos {
  id: string;
  nombre: string;
  sub: string;
  valor: number;
}

const claveDia = (d: Date): string => d.toISOString().slice(0, 10);

/** Serie diaria de unidades pedidas en los últimos `dias` días. */
export function serieUnidades(pedidos: PedidoRegistrado[], dias = 14): PuntoSerie[] {
  const porDia = new Map<string, number>();
  pedidos.forEach((o) => {
    const k = o.fecha.slice(0, 10);
    porDia.set(k, (porDia.get(k) ?? 0) + o.unidades);
  });

  const hoy = new Date();
  const out: PuntoSerie[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    out.push({
      label: d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
      valor: porDia.get(claveDia(d)) ?? 0,
    });
  }
  return out;
}

/** Total de la serie. */
export const totalSerie = (serie: PuntoSerie[]): number => serie.reduce((a, s) => a + s.valor, 0);

/** Productos más pedidos (unidades acumuladas del historial). */
export function topPedidos(pedidos: PedidoRegistrado[], n = 7): FilaRankingDatos[] {
  const acum = new Map<string, FilaRankingDatos>();
  pedidos.forEach((o) =>
    o.items.forEach((l) => {
      const clave = l.id || l.n;
      const prev = acum.get(clave);
      if (prev) prev.valor += l.c;
      else acum.set(clave, { id: clave, nombre: l.n, sub: l.lab, valor: l.c });
    }),
  );
  return [...acum.values()].sort((a, b) => b.valor - a.valor).slice(0, n);
}

/** Sucursales con más pedidos armados. */
export function porSucursal(pedidos: PedidoRegistrado[]): FilaRankingDatos[] {
  const acum = new Map<string, FilaRankingDatos>();
  pedidos.forEach((o) => {
    const clave = o.sucursalId || o.sucursalNombre;
    const prev = acum.get(clave);
    if (prev) prev.valor += 1;
    else acum.set(clave, { id: clave, nombre: o.sucursalNombre, sub: 'pedidos enviados', valor: 1 });
  });
  return [...acum.values()].sort((a, b) => b.valor - a.valor);
}

export interface ResumenPedidos {
  cantidad: number;
  unidades: number;
  valor: number;
  ticket: number;
}

/** KPIs del historial de pedidos. */
export function resumenPedidos(pedidos: PedidoRegistrado[]): ResumenPedidos {
  const cantidad = pedidos.length;
  const unidades = pedidos.reduce((a, o) => a + o.unidades, 0);
  const valor = pedidos.reduce((a, o) => a + o.total, 0);
  return { cantidad, unidades, valor, ticket: cantidad ? Math.round(valor / cantidad) : 0 };
}
