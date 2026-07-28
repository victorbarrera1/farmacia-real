import { SUCURSALES } from '../data/sucursales';
import { useStore } from '../store/StoreContext';
import type { Sucursal } from '../types';

/** Sucursal seleccionada (con fallback a la primera). */
export function useSucursalActual(): Sucursal {
  const { estado } = useStore();
  return SUCURSALES.find((s) => s.id === estado.sucursal) ?? SUCURSALES[0];
}
