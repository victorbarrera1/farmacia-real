import { useRef } from 'react';
import { Icon } from '../icons/Icon';
import { useStore } from '../../store/StoreContext';

/** Caja de búsqueda. Varias instancias se sincronizan vía el store. */
export function SearchBox({
  placeholder = 'Buscar remedio, marca o principio activo…',
  className = '',
}: {
  placeholder?: string;
  className?: string;
}) {
  const { estado, dispatch } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const lleno = estado.busqueda.length > 0;

  return (
    <div className={`relative flex min-w-0 flex-1 items-center ${className}`}>
      <Icon id="i-lupa" className="pointer-events-none absolute left-[15px] size-5 text-azul" />
      <input
        ref={inputRef}
        type="search"
        className="field pl-[46px] pr-[44px]"
        placeholder={placeholder}
        aria-label="Buscar productos"
        autoComplete="off"
        value={estado.busqueda}
        onChange={(e) => dispatch({ type: 'busqueda', q: e.target.value })}
      />
      {lleno && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            dispatch({ type: 'busqueda', q: '' });
            inputRef.current?.focus();
          }}
          className="absolute right-2 grid size-[30px] place-items-center rounded-full text-gris hover:bg-fondo"
        >
          <Icon id="i-x" className="size-[15px]" />
        </button>
      )}
    </div>
  );
}
