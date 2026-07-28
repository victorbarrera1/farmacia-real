import type { Dia, Sucursal, Tramo } from '../types';

/** Tramo horario que aplica a un día dado (o undefined). */
export const tramoDe = (suc: Sucursal, dia: Dia): Tramo | undefined =>
  suc.horario.find((h) => h.d.includes(dia));

const aMin = (s: string): number => +s.slice(0, 2) * 60 + +s.slice(3, 5);

/** ¿La sucursal está abierta en este momento? */
export function estaAbierto(suc: Sucursal, ahora: Date = new Date()): boolean {
  const t = tramoDe(suc, ahora.getDay() as Dia);
  if (!t || t.cerrado) return false;
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  return min >= aMin(t.abre) && min < aMin(t.cierra);
}

/** Texto de estado para hoy: "Abierto · cierra 21:00" / "Hoy cerrado". */
export function textoHoy(suc: Sucursal, ahora: Date = new Date()): string {
  const t = tramoDe(suc, ahora.getDay() as Dia);
  if (!t || t.cerrado) return 'Hoy cerrado';
  return estaAbierto(suc, ahora)
    ? 'Abierto · cierra ' + t.cierra
    : 'Hoy ' + t.abre + ' a ' + t.cierra;
}
