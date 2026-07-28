import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { useDragToClose } from '../../hooks/useDragToClose';

interface DrawerProps {
  abierto: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo?: ReactNode;
  labelId: string;
  children: ReactNode;
  /** Pie fijo del cajón (acciones). */
  footer?: ReactNode;
  cerrarLabel?: string;
}

/**
 * Cajón lateral / hoja inferior reutilizable. Maneja velo, foco al abrir,
 * cierre con Escape y arrastre-para-cerrar en móvil.
 */
export function Drawer({
  abierto, onClose, titulo, subtitulo, labelId, children, footer, cerrarLabel = 'Cerrar',
}: DrawerProps) {
  const refCajon = useRef<HTMLElement>(null);
  const refCerrar = useRef<HTMLButtonElement>(null);

  useDragToClose(refCajon, { enabled: abierto, onClose });

  /* Foco al abrir + cierre con Escape. */
  useEffect(() => {
    if (!abierto) return;
    refCerrar.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [abierto, onClose]);

  return (
    <>
      <div className="velo" data-abierto={abierto ? 'si' : 'no'} onClick={onClose} />
      <aside
        ref={refCajon}
        className="cajon"
        data-abierto={abierto ? 'si' : 'no'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
      >
        <span className="tirador" />
        <div className="flex items-start gap-3.5 border-b border-linea px-5 py-4">
          <div className="mr-auto">
            <h3 id={labelId} className="text-[1.14rem] font-extrabold">{titulo}</h3>
            {subtitulo && <span className="mt-0.5 block text-[0.85rem] font-normal text-gris">{subtitulo}</span>}
          </div>
          <button
            ref={refCerrar}
            type="button"
            aria-label={cerrarLabel}
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-fondo text-gris hover:bg-linea hover:text-texto"
          >
            <Icon id="i-x" className="size-[17px]" />
          </button>
        </div>

        <div className="cajon-cuerpo flex-1 overflow-y-auto px-5 py-2 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]">
          {children}
        </div>

        {footer && <div className="border-t border-linea bg-fondo px-5 pb-5 pt-4">{footer}</div>}
      </aside>
    </>
  );
}
