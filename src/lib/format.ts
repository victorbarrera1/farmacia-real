/** Formatea un número como pesos chilenos: 1290 → "$1.290". */
export const clp = (n: number): string => '$' + n.toLocaleString('es-CL');

/** Normaliza texto para búsqueda: sin tildes, en minúsculas. */
export const sinTildes = (t: string): string =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
