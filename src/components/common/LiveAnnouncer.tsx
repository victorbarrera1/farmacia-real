import { useStore } from '../../store/StoreContext';

/**
 * Región aria-live: la grilla se redibuja entera y sin esto los cambios
 * (agregar producto, cambiar sucursal) pasarían en silencio para lectores.
 */
export function LiveAnnouncer() {
  const { anuncio } = useStore();
  return (
    <p
      aria-live="polite"
      className="absolute h-px w-px overflow-hidden whitespace-nowrap"
      style={{ clip: 'rect(0 0 0 0)' }}
    >
      {anuncio}
    </p>
  );
}
