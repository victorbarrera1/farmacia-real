import { Icon, Ilu } from '../icons/Icon';
import { Drawer } from './Drawer';
import { useStore } from '../../store/StoreContext';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { clp } from '../../lib/format';
import { stockDe } from '../../lib/stock';
import { itemsPedido, totalPedido, cantidadPedido } from '../../lib/pedido';
import { waLink, msgPedido } from '../../lib/whatsapp';

/** Cajón del pedido: líneas, avisos de stock y envío por WhatsApp. */
export function OrderDrawer() {
  const { estado, dispatch } = useStore();
  const suc = useSucursalActual();

  const items = itemsPedido(estado.pedido);
  const n = cantidadPedido(estado.pedido);
  const agotados = items.filter(({ p }) => stockDe(p, suc.id) === 0);

  const subtitulo = n
    ? `${n} ${n === 1 ? 'producto' : 'productos'} · retiro en ${suc.nombre}`
    : 'Aún no agregas productos';

  const footer = (
    <>
      <div className="mb-[5px] flex items-baseline justify-between">
        <span className="text-[0.92rem] font-semibold text-gris">Total referencial</span>
        <span className="num text-[1.7rem] font-extrabold tracking-[-0.03em]">{clp(totalPedido(estado.pedido))}</span>
      </div>
      <p className="mb-3 text-[0.8rem] leading-normal text-gris-2">
        Esto no es una compra. Al enviar, te respondemos por WhatsApp confirmando disponibilidad y valor final.
      </p>
      <a href={waLink(msgPedido(estado.pedido, suc), suc)} target="_blank" rel="noopener" className="btn btn-wa btn-ancho">
        <Icon id="i-wa" /> Enviar pedido por WhatsApp
      </a>
      <p className="mt-3 flex items-center justify-center gap-2 text-[0.85rem] text-gris">
        <Icon id="i-pin" className="size-[15px] shrink-0 text-azul" /> Se envía a{' '}
        <b className="font-bold text-texto">{suc.nombre}</b>
      </p>
    </>
  );

  return (
    <Drawer
      abierto={estado.cajon === 'pedido'}
      onClose={() => dispatch({ type: 'cerrarCajones' })}
      titulo="Mi pedido"
      subtitulo={subtitulo}
      labelId="tPed"
      cerrarLabel="Cerrar pedido"
      footer={items.length ? footer : undefined}
    >
      {!items.length ? (
        <div className="px-4 py-14 text-center text-gris">
          <Icon id="i-bolsa" className="mx-auto mb-3.5 size-[52px] text-linea" />
          <b className="mb-[7px] block text-[1.1rem] font-extrabold text-texto">Tu pedido está vacío</b>
          <p className="mx-auto max-w-[34ch] text-[0.92rem]">
            Agrega productos del catálogo y te los apartamos en el local que elijas. No pagas nada aquí.
          </p>
        </div>
      ) : (
        <>
          {agotados.length > 0 && (
            <div className="my-3.5 flex items-start gap-2.5 rounded-lg border border-ambar-borde bg-ambar-pale px-[15px] py-3 text-[0.86rem] leading-normal text-[#6B4A08]">
              <Icon id="i-alerta" className="mt-px size-[18px] shrink-0 text-ambar" />
              <div>
                <b className="font-extrabold">
                  {agotados.length === 1 ? 'Un producto no está' : `${agotados.length} productos no están`}
                </b>{' '}
                con stock hoy en {suc.nombre}. Igual puedes enviar el pedido: lo buscamos en otro local o te avisamos
                cuando llegue.
              </div>
            </div>
          )}

          {items.map(({ p, c }) => (
            <div key={p.id} className="flex items-start gap-3 border-b border-linea-2 py-3.5 last:border-b-0">
              <span className="grid size-[52px] shrink-0 place-items-center rounded-md bg-fondo">
                <Ilu il={p.il} className="size-[74%]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[0.94rem] font-bold leading-tight">{p.n}</div>
                <div className="mt-0.5 text-[0.8rem] leading-snug text-gris-2">
                  {p.pres} · {p.lab}
                  {p.rec && ' · requiere receta'}
                  {stockDe(p, suc.id) === 0 && (
                    <span className="font-bold text-ambar"> · sin stock acá</span>
                  )}
                </div>
                <div className="num mt-[5px] text-[1rem] font-extrabold">{clp(p.p * c)}</div>
              </div>
              <div className="flex shrink-0 items-center overflow-hidden rounded-full border-2 border-linea">
                <button
                  type="button"
                  aria-label={`Quitar una unidad de ${p.n}`}
                  onClick={() => dispatch({ type: 'cambiar', id: p.id, delta: -1 })}
                  className="grid size-11 place-items-center text-[1.3rem] font-bold leading-none text-azul hover:bg-azul-pale"
                >
                  −
                </button>
                <span className="num min-w-[30px] text-center text-[0.98rem] font-extrabold">{c}</span>
                <button
                  type="button"
                  aria-label={`Agregar una unidad de ${p.n}`}
                  onClick={() => dispatch({ type: 'cambiar', id: p.id, delta: 1 })}
                  className="grid size-11 place-items-center text-[1.3rem] font-bold leading-none text-azul hover:bg-azul-pale"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </Drawer>
  );
}
