import { useMemo } from 'react';
import type { Producto } from '../types';
import { PRODUCTOS } from '../data/productos';
import { sinTildes } from '../lib/format';
import { stockDe } from '../lib/stock';
import { useStore } from '../store/StoreContext';

/** Productos visibles según categoría, búsqueda, filtro de stock y orden. */
export function useCatalogo(): Producto[] {
  const { estado } = useStore();
  const { sucursal, categoria, busqueda, soloStock, orden } = estado;

  return useMemo(() => {
    const q = sinTildes(busqueda.trim());
    const lista = PRODUCTOS.filter((p) => {
      if (categoria !== 'todos' && p.cat !== categoria) return false;
      if (soloStock && stockDe(p, sucursal) === 0) return false;
      if (!q) return true;
      return sinTildes(`${p.n} ${p.pres} ${p.lab} ${p.act}`).includes(q);
    });

    switch (orden) {
      case 'precio-asc':
        return [...lista].sort((a, b) => a.p - b.p);
      case 'precio-desc':
        return [...lista].sort((a, b) => b.p - a.p);
      case 'nombre':
        return [...lista].sort((a, b) => a.n.localeCompare(b.n, 'es'));
      /* Recomendados: primero lo que sí hay en este local, manteniendo
         el orden del catálogo dentro de cada grupo. */
      default:
        return [...lista].sort(
          (a, b) => Number(stockDe(b, sucursal) > 0) - Number(stockDe(a, sucursal) > 0),
        );
    }
  }, [sucursal, categoria, busqueda, soloStock, orden]);
}
