import { useMemo } from 'react';
import type { Producto } from '../types';
import { sinTildes } from '../lib/format';
import { precioDe, stockDe, visibleEn } from '../lib/stock';
import { useStore } from '../store/StoreContext';
import { RANGOS } from '../store/state';
import { useProductos, useSucursales } from './useDatos';

/** Productos del local, sin filtrar por facetas (base para las facetas). */
export function useProductosDelLocal(): Producto[] {
  const { estado } = useStore();
  const productos = useProductos();
  const sucursales = useSucursales();

  return useMemo(
    () => productos.filter((p) => visibleEn(p, estado.sucursal, sucursales)),
    [productos, sucursales, estado.sucursal],
  );
}

/** Productos visibles según categoría, búsqueda, facetas y orden. */
export function useCatalogo(): Producto[] {
  const { estado } = useStore();
  const sucursales = useSucursales();
  const delLocal = useProductosDelLocal();
  const { sucursal, categoria, busqueda, soloStock, orden, labs, soloBio, sinReceta, precio } = estado;

  return useMemo(() => {
    const q = sinTildes(busqueda.trim());
    const [min, max] = RANGOS[precio];

    const lista = delLocal.filter((p) => {
      if (categoria !== 'todos' && p.cat !== categoria) return false;
      if (soloStock && stockDe(p, sucursal, sucursales) === 0) return false;
      if (labs.length && !labs.includes(p.lab)) return false;
      if (soloBio && !p.be) return false;
      if (sinReceta && p.rec) return false;
      if (precio !== 'todos') {
        const valor = precioDe(p, sucursal, sucursales);
        if (valor < min || valor > max) return false;
      }
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
  }, [delLocal, sucursales, sucursal, categoria, busqueda, soloStock, orden, labs, soloBio, sinReceta, precio]);
}
