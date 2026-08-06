import { Icon } from '../icons/Icon';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { estaAbierto, textoHoy } from '../../lib/horarios';

/**
 * Barra de sucursal para móvil y tablet: dónde retiras, si está abierto y
 * botón para cambiar. En escritorio el selector vive en la cabecera
 * (ver <BranchPicker/>), así que esta barra se oculta.
 */
export function BranchBar() {
  const { dispatch } = useStore();
  const suc = useSucursalActual();
  const abierto = estaAbierto(suc);

  return (
    <div className="border-y border-azul-borde bg-azul-pale min-[900px]:hidden">
      <div className="env flex min-h-[52px] flex-wrap items-center gap-3 py-[9px]">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Icon id="i-pin" className="size-[22px] shrink-0 text-azul" />
          <span className="min-w-0 leading-tight">
            <span className="block text-[0.76rem] text-gris">Retiras en</span>
            <b className="block truncate text-[1rem] font-extrabold text-azul-osc">{suc.corto}</b>
          </span>
        </div>

        <span className="hidden items-center gap-1.5 rounded-full border border-azul-borde bg-white px-[11px] py-[5px] text-[0.82rem] font-bold text-azul-osc min-[560px]:inline-flex">
          <span
            className={`size-[7px] rounded-full ${
              abierto ? 'bg-ok shadow-[0_0_0_3px_rgba(23,134,75,0.22)]' : 'bg-gris-2'
            }`}
          />
          {textoHoy(suc)}
        </span>

        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => dispatch({ type: 'abrirCajon', cajon: 'suc' })}
          className="flex h-11 shrink-0 items-center gap-[7px] rounded-lg border-2 border-azul bg-white px-4 text-[0.9rem] font-bold text-azul transition-colors hover:bg-azul hover:text-white"
        >
          <Icon id="i-grilla" className="size-[15px]" />
          <span>
            Cambiar<span className="hidden min-[420px]:inline">&nbsp;sucursal</span>
          </span>
        </button>
      </div>
    </div>
  );
}
