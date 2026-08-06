import { useMemo } from 'react';
import type { Producto } from '../types';
import { sinTildes } from '../lib/format';
import { precioDe, stockDe, visibleEn } from '../lib/stock';
import { useStore } from '../store/StoreContext';
import { useProductos, useSucursales } from './useDatos';

/** Productos visibles según categoría, búsqueda, filtro de stock y orden. */
export function useCatalogo(): Producto[] {
  const { estado } = useStore();
  const productos = useProductos();
  const sucursales = useSucursales();
  const { sucursal, categoria, busqueda, soloStock, orden } = estado;

  return useMemo(() => {
    const q = sinTildes(busqueda.trim());
    const lista = productos.filter((p) => {
      /* Cada local decide qué muestra: vis[idx] === false lo saca del catálogo. */
      if (!visibleEn(p, sucursal, sucursales)) return false;
      if (categoria !== 'todos' && p.cat !== categoria) return false;
      if (soloStock && stockDe(p, sucursal, sucursales) === 0) return false;
      if (!q) return true;
      return sinTildes(`${p.n} ${p.pres} ${p.lab} ${p.act}`).includes(q);
    });

    switch (orden) {
      case 'precio-asc':
        return [...lista].sort(
          (a, b) => precioDe(a, sucursal, sucursales) - precioDe(b, sucursal, sucursales),
        );
      case 'precio-desc':
        return [...lista].sort(
          (a, b) => precioDe(b, sucursal, sucursales) - precioDe(a, sucursal, sucursales),
        );
      case 'nombre':
        return [...lista].sort((a, b) => a.n.localeCompare(b.n, 'es'));
      /* Recomendados: primero lo que sí hay en este local, manteniendo
         el orden del catálogo dentro de cada grupo. */
      default:
        return [...lista].sort(
          (a, b) =>
            Number(stockDe(b, sucursal, sucursales) > 0) -
            Number(stockDe(a, sucursal, sucursales) > 0),
        );
    }
  }, [productos, sucursales, sucursal, categoria, busqueda, soloStock, orden]);
}
