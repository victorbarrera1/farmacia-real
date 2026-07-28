import {
  createContext, useContext, useEffect, useReducer, useState, useCallback,
  type ReactNode, type Dispatch,
} from 'react';
import type { AppState } from './state';
import { estadoInicial, cargar, guardar } from './state';
import { reducer, type Action } from './reducer';

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

  /* Persistimos solo cuando cambia lo que debe sobrevivir a recargas. */
  useEffect(() => { guardar(estado); }, [estado.sucursal, estado.pedido]);

  /* Bloqueo de scroll del fondo cuando hay un cajón abierto. */
  useEffect(() => {
    document.body.classList.toggle('trabado', estado.cajon !== null);
  }, [estado.cajon]);

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
