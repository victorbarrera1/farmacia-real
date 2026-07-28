import { useStore } from '../../store/StoreContext';
import { clp } from '../../lib/format';
import { totalPedido, cantidadPedido } from '../../lib/pedido';

/** Barra de pedido fija en la parte inferior (solo móvil). */
export function MobileOrderBar() {
  const { estado, dispatch } = useStore();
  const n = cantidadPedido(estado.pedido);
  const visible = n > 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[75] border-t border-linea bg-white shadow-[0_-4px_18px_rgba(20,40,32,0.11)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.32,.72,0,1)] min-[720px]:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ padding: '10px 0 calc(10px + env(safe-area-inset-bottom))' }}
    >
      <div className="env">
        <button
          type="button"
          onClick={() => dispatch({ type: 'abrirCajon', cajon: 'pedido' })}
          className="flex min-h-[54px] w-full items-center gap-3 rounded-lg bg-azul px-[18px] text-[1rem] font-bold text-white hover:bg-azul-osc"
        >
          <span className="grid h-[27px] min-w-[27px] place-items-center rounded-full bg-white/[0.24] px-[7px] text-[0.86rem] font-extrabold">
            {n}
          </span>
          <span className="mr-auto">Ver mi pedido</span>
          <span className="num">{clp(totalPedido(estado.pedido))}</span>
        </button>
      </div>
    </div>
  );
}
