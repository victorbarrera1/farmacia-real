import type { Sucursal } from '../types';
import { CLAVES } from '../config';
import { getOrigen } from '../data/repo';
import { pedir } from './api';
import type { ItemPedido } from './pedido';

/* ================================================================
   HISTORIAL DE RESERVAS
   ----------------------------------------------------------------
   Los pedidos se cierran por WhatsApp: esto registra lo que el visitante
   armó y envió, para que el panel tenga rankings y montos reales.

   · Con backend  → POST /api/pedidos (el dueño ve las reservas de todos
                    los visitantes, desde cualquier dispositivo).
   · Sin backend  → localStorage, solo de este navegador.

   Guardamos una copia de nombre y precio de cada línea: así el historial
   no se deforma si después el panel edita o elimina el producto.
   No se guardan datos personales.
   ================================================================ */

export interface LineaPedido {
  id: string;
  n: string;
  pres: string;
  lab: string;
  /** Precio unitario referencial al momento de la reserva. */
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

/** Máximo de pedidos guardados en el navegador. */
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

/** Historial en memoria, del más reciente al más antiguo. */
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

function fijar(lista: PedidoRegistrado[], persistir = true): void {
  cache = lista;
  if (persistir) {
    try {
      localStorage.setItem(CLAVES.pedidos, JSON.stringify(lista.slice(0, TOPE)));
    } catch {
      /* modo privado: queda solo en memoria */
    }
  }
  avisar();
}

/** Suscripción para `useSyncExternalStore`. */
export function suscribirPedidos(fn: () => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** Trae el historial del servidor (lo llama el panel al abrir la pestaña). */
export async function hidratarPedidos(): Promise<void> {
  if (getOrigen() !== 'api') return;
  const r = await pedir<{ pedidos: unknown[] }>('/api/pedidos');
  fijar(r.pedidos.map(sanear).filter((p): p is PedidoRegistrado => p !== null), false);
}

/** Registra una reserva enviada por WhatsApp. */
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

  /* Optimista: se ve al instante en este navegador… */
  fijar([registro, ...leerPedidos()].slice(0, TOPE), getOrigen() !== 'api');
  /* …y se manda al servidor si existe. No bloquea el click a WhatsApp. */
  if (getOrigen() === 'api') {
    pedir('/api/pedidos', { metodo: 'POST', cuerpo: registro, silencioso: true }).catch(
      () => undefined,
    );
  }
}

export function eliminarPedido(id: string): void {
  fijar(leerPedidos().filter((p) => p.id !== id), getOrigen() !== 'api');
  if (getOrigen() === 'api') {
    pedir(`/api/pedidos?id=${encodeURIComponent(id)}`, { metodo: 'DELETE' }).catch(() => undefined);
  }
}

export function borrarHistorial(): void {
  fijar([], getOrigen() !== 'api');
  if (getOrigen() === 'api') {
    pedir('/api/pedidos?todos=1', { metodo: 'DELETE' }).catch(() => undefined);
  } else {
    try {
      localStorage.setItem(CLAVES.pedidos, '[]');
    } catch {
      /* nada que hacer */
    }
  }
}
