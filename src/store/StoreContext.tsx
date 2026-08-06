import {
  createContext, useContext, useEffect, useReducer, useState, useCallback,
  type ReactNode, type Dispatch,
} from 'react';
import type { AppState } from './state';
import { estadoInicial, cargar, guardar } from './state';
import { reducer, type Action } from './reducer';
import { useSucursales } from '../hooks/useDatos';

interface StoreValue {
  estado: AppState;
  dispatch: Dispatch<Action>;
  /** Texto para el lector de pantalla (región aria-live). */
  anuncio: string;
  anunciar: (texto: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function init(): AppState {
  return { ...estadoInicial, ...cargar() };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, undefined, init);
  const [anuncio, setAnuncio] = useState('');
  const anunciar = useCallback((texto: string) => setAnuncio(texto), []);

  /* Suscribirse acá repinta toda la tienda cuando el panel edita datos. */
  const sucursales = useSucursales();

  /* Persistimos solo cuando cambia lo que debe sobrevivir a recargas. */
  useEffect(() => { guardar(estado); }, [estado.sucursal, estado.pedido]);

  /* Si el panel eliminó la sucursal elegida, caemos a la primera vigente. */
  useEffect(() => {
    if (!sucursales.some((s) => s.id === estado.sucursal) && sucursales[0]) {
      dispatch({ type: 'sucursal', id: sucursales[0].id });
    }
  }, [sucursales, estado.sucursal]);

  /* Bloqueo de scroll del fondo cuando hay un cajón, ficha o modal abierto. */
  useEffect(() => {
    document.body.classList.toggle(
      'trabado',
      estado.cajon !== null || estado.detalle !== null || estado.legal,
    );
  }, [estado.cajon, estado.detalle, estado.legal]);

  return (
    <StoreContext.Provider value={{ estado, dispatch, anuncio, anunciar }}>
      {children}
    </StoreContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}
