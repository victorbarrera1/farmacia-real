import type { Producto } from '../../types';
import { PRODUCTOS } from '../../data/productos';

/* ================================================================
   Analítica simulada (demanda histórica) para el panel.
   Determinista a partir del id del producto → estable entre recargas.
   Reemplazar por eventos reales (ventas, vistas) cuando existan.
   ================================================================ */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Generador pseudoaleatorio con semilla (LCG). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Peso de demanda por categoría (los OTC rotan más). */
const PESO_CAT: Record<string, number> = {
  medicamentos: 1.4,
  cuidado: 1.2,
  vitaminas: 1,
  dermo: 0.8,
  infantil: 0.85,
  equipos: 0.5,
};

export interface Demanda {
  p: Producto;
  ventas: number;
  vistas: number;
}

/** Ventas y vistas simuladas de los últimos 30 días, por producto. */
export const DEMANDA: Demanda[] = PRODUCTOS.map((p) => {
  const r = rng(hash(p.id + p.n));
  const peso = PESO_CAT[p.cat] ?? 1;
  const ventas = Math.round((25 + r() * 260) * peso);
  const vistas = Math.round(ventas * (3 + r() * 4)); // embudo: más vistas que ventas
  return { p, ventas, vistas };
});

/** Top N por ventas. */
export const topPedidos = (n = 8): Demanda[] =>
  [...DEMANDA].sort((a, b) => b.ventas - a.ventas).slice(0, n);

/** Top N por vistas (clics en la ficha). */
export const topVistos = (n = 8): Demanda[] =>
  [...DEMANDA].sort((a, b) => b.vistas - a.vistas).slice(0, n);

export interface PuntoSerie {
  label: string;
  valor: number;
}

const TOTAL_DIARIO = DEMANDA.reduce((a, d) => a + d.ventas, 0) / 30;

/** Serie de ventas de los últimos `dias` días (con caída de fin de semana). */
export function serieVentas(dias = 14): PuntoSerie[] {
  const r = rng(0xa11ce);
  const hoy = new Date();
  const out: PuntoSerie[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    const finde = d.getDay() === 0 || d.getDay() === 6 ? 0.62 : 1;
    const ruido = 0.82 + r() * 0.36;
    out.push({
      label: d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
      valor: Math.round(TOTAL_DIARIO * finde * ruido),
    });
  }
  return out;
}

/** Total de ventas de la serie. */
export const totalSerie = (serie: PuntoSerie[]): number =>
  serie.reduce((a, s) => a + s.valor, 0);

/** Conversión global vistas → ventas (%). */
export const conversion = (): number => {
  const v = DEMANDA.reduce((a, d) => a + d.vistas, 0);
  const c = DEMANDA.reduce((a, d) => a + d.ventas, 0);
  return v ? Math.round((c / v) * 1000) / 10 : 0;
};
