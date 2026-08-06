import type { Sucursal } from '../types';
import { CLAVES } from '../config';
import type { ItemPedido } from './pedido';

/* ================================================================
   HISTORIAL LOCAL DE PEDIDOS
   ----------------------------------------------------------------
   No hay backend: los pedidos se envían por WhatsApp. Esto registra,
   solo en este navegador, lo que el visitante armó y envió, para que
   el panel pueda mostrar un historial y rankings con datos reales.

   Guardamos una copia de nombre/precio de cada línea: así el historial
   no se deforma si después el panel edita o elimina el producto.

   TODO(api): POST /api/pedidos al enviar y GET /api/pedidos en el panel.
   ================================================================ */

export interface LineaPedido {
  id: string;
  n: string;
  pres: string;
  lab: string;
  /** Precio unitario referencial al momento del pedido. */
  p: number;
  c: number;
}

export interface PedidoRegistrado {
  id: string;
  /** ISO 8601. */
  fecha: string;
  sucursalId: string;
  sucursalNombre: string;
  total: number;
  unidades: number;
  items: LineaPedido[];
}

/** Máximo de pedidos guardados (evita inflar localStorage). */
const TOPE = 200;

let cache: PedidoRegistrado[] | null = null;
const oyentes = new Set<() => void>();
const avisar = (): void => oyentes.forEach((f) => f());

function sanear(v: unknown): PedidoRegistrado | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.fecha !== 'string') return null;
  const items = Array.isArray(o.items)
    ? o.items
        .map((x) => {
          const l = x as Record<string, unknown>;
          if (typeof l.n !== 'string') return null;
          return {
            id: typeof l.id === 'string' ? l.id : '',
            n: l.n,
            pres: typeof l.pres === 'string' ? l.pres : '',
            lab: typeof l.lab === 'string' ? l.lab : '',
            p: Number(l.p) || 0,
            c: Math.max(1, Math.trunc(Number(l.c) || 1)),
          } as LineaPedido;
        })
        .filter((l): l is LineaPedido => l !== null)
    : [];
  if (!items.length) return null;
  return {
    id: o.id,
    fecha: o.fecha,
    sucursalId: typeof o.sucursalId === 'string' ? o.sucursalId : '',
    sucursalNombre: typeof o.sucursalNombre === 'string' ? o.sucursalNombre : '—',
    total: Number(o.total) || items.reduce((a, l) => a + l.p * l.c, 0),
    unidades: Number(o.unidades) || items.reduce((a, l) => a + l.c, 0),
    items,
  };
}

/** Historial completo, del más reciente al más antiguo. */
export function leerPedidos(): PedidoRegistrado[] {
  if (cache) return cache;
  try {
    const g = JSON.parse(localStorage.getItem(CLAVES.pedidos) || '[]');
    cache = Array.isArray(g) ? g.map(sanear).filter((p): p is PedidoRegistrado => p !== null) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function guardar(lista: PedidoRegistrado[]): void {
  cache = lista;
  try {
    localStorage.setItem(CLAVES.pedidos, JSON.stringify(lista));
  } catch {
    /* modo privado: queda solo en memoria */
  }
  avisar();
}

/** Suscripción para `useSyncExternalStore`. */
export function suscribirPedidos(fn: () => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** Registra un pedido enviado por WhatsApp. */
export function registrarPedido(items: ItemPedido[], suc: Sucursal): void {
  if (!items.length) return;
  const lineas: LineaPedido[] = items.map(({ p, c }) => ({
    id: p.id, n: p.n, pres: p.pres, lab: p.lab, p: p.p, c,
  }));
  const registro: PedidoRegistrado = {
    id: `o-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    fecha: new Date().toISOString(),
    sucursalId: suc.id,
    sucursalNombre: suc.nombre,
    total: lineas.reduce((a, l) => a + l.p * l.c, 0),
    unidades: lineas.reduce((a, l) => a + l.c, 0),
    items: lineas,
  };
  guardar([registro, ...leerPedidos()].slice(0, TOPE));
}

export function eliminarPedido(id: string): void {
  guardar(leerPedidos().filter((p) => p.id !== id));
}

export function borrarHistorial(): void {
  guardar([]);
}
