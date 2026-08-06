import { getSucursales } from '../data/repo';
import { useSucursales } from './useDatos';
import { useStore } from '../store/StoreContext';
import type { Sucursal } from '../types';

/** Sucursal seleccionada (con fallback a la primera vigente). */
export function useSucursalActual(): Sucursal {
  const { estado } = useStore();
  const sucursales = useSucursales();
  return sucursales.find((s) => s.id === estado.sucursal) ?? sucursales[0] ?? getSucursales()[0];
}
