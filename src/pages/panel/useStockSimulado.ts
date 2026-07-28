import { useCallback, useEffect, useState } from 'react';
import { PRODUCTOS } from '../../data/productos';
import { type StockMap, stockSemilla } from './metrics';

const CLAVE = 'fr_panel_stock';

function cargar(): StockMap {
  const semilla = stockSemilla();
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) || '{}');
    PRODUCTOS.forEach((p) => {
      const v = g[p.id];
      if (Array.isArray(v) && v.length === p.st.length && v.every((n) => Number.isFinite(n))) {
        semilla[p.id] = v.map((n) => Math.max(0, Math.trunc(n)));
      }
    });
  } catch {
    /* datos corruptos: usamos la semilla */
  }
  return semilla;
}

/**
 * Stock simulado del panel. Persiste en localStorage para que las ediciones
 * sobrevivan a recargas; `restablecer` vuelve al catálogo original.
 */
export function useStockSimulado() {
  const [stock, setStock] = useState<StockMap>(cargar);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(stock));
    } catch {
      /* modo privado: seguimos sin persistir */
    }
  }, [stock]);

  /** Fija las unidades de un producto en una sucursal (por índice). */
  const fijar = useCallback((id: string, idx: number, unidades: number) => {
    setStock((prev) => {
      const fila = [...(prev[id] ?? [])];
      fila[idx] = Math.max(0, Math.trunc(unidades) || 0);
      return { ...prev, [id]: fila };
    });
  }, []);

  /** Suma un delta (p. ej. +1 / −1) a las unidades de un producto/sucursal. */
  const ajustar = useCallback((id: string, idx: number, delta: number) => {
    setStock((prev) => {
      const fila = [...(prev[id] ?? [])];
      fila[idx] = Math.max(0, (fila[idx] ?? 0) + delta);
      return { ...prev, [id]: fila };
    });
  }, []);

  const restablecer = useCallback(() => setStock(stockSemilla()), []);

  return { stock, fijar, ajustar, restablecer };
}
