import { Icon } from '../icons/Icon';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { waLink, msgGeneral } from '../../lib/whatsapp';

/** Estado vacío del catálogo: ningún producto coincide con los filtros. */
export function EmptyState() {
  const { estado } = useStore();
  const suc = useSucursalActual();
  const buscado = estado.busqueda || 'un producto que no aparece en la web';

  return (
    <div className="card col-span-full px-5 py-14 text-center">
      <Icon id="i-lupa" className="mx-auto mb-3.5 size-[52px] text-azul-borde" />
      <b className="mb-[7px] block text-[1.15rem] font-extrabold">No encontramos ese producto</b>
      <p className="mx-auto max-w-[44ch] text-[0.95rem] text-gris">
        Puede que no esté en este local. Escríbenos y lo buscamos en las otras sucursales o te lo pedimos.
      </p>
      <a
        href={waLink(msgGeneral(suc) + '\n\nEstoy buscando: ' + buscado, suc)}
        target="_blank"
        rel="noopener"
        className="btn btn-wa mt-5"
      >
        <Icon id="i-wa" /> Consultar disponibilidad
      </a>
    </div>
  );
}
