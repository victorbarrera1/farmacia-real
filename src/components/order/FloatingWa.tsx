import { Icon } from '../icons/Icon';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cantidadPedido } from '../../lib/pedido';
import { waLink, msgGeneral } from '../../lib/whatsapp';

/** Botón flotante de WhatsApp. Se oculta si hay un cajón o la barra móvil. */
export function FloatingWa() {
  const { estado } = useStore();
  const suc = useSucursalActual();
  const movil = useMediaQuery('(max-width: 719px)');
  const hayPedido = cantidadPedido(estado.pedido) > 0;

  /* Con un cajón abierto o la barra de pedido móvil visible, estorba. */
  const oculto = estado.cajon !== null || (movil && hayPedido);

  return (
    <a
      href={waLink(msgGeneral(suc), suc)}
      target="_blank"
      rel="noopener"
      className={`fixed right-4 z-[70] flex min-h-14 items-center gap-2.5 rounded-full bg-wa px-5 text-[0.98rem] font-extrabold text-wa-texto no-underline shadow-[0_4px_16px_rgba(37,211,102,0.4),0_2px_6px_rgba(0,0,0,0.1)] transition-[background-color,opacity] hover:bg-wa-osc hover:text-white ${
        oculto ? 'pointer-events-none opacity-0' : ''
      }`}
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      <Icon id="i-wa" className="size-[25px]" />
      <span className="hidden min-[520px]:inline">Escríbenos</span>
    </a>
  );
}
