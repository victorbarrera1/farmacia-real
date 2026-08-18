'use client';

import { Icon } from '../icons/Icon';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { waLink, msgGeneral } from '../../lib/whatsapp';

/** Acceso directo de escritorio; en móvil no cubre productos ni la barra inferior. */
export function FloatingWa() {
  const { estado } = useStore();
  const suc = useSucursalActual();
  const oculto = estado.cajon !== null || estado.detalle !== null || estado.legal || estado.gate;

  if (oculto) return null;

  return (
    <a
      href={waLink(msgGeneral(suc), suc)}
      target="_blank"
      rel="noopener"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-[70] hidden min-h-12 items-center gap-2 rounded-full bg-wa px-5 text-[0.94rem] font-extrabold text-wa-texto no-underline shadow-card hover:bg-wa-osc hover:text-white min-[900px]:flex"
    >
      <Icon id="i-wa" className="size-[22px]" />
      Escríbenos
    </a>
  );
}
