import { Icon } from '../icons/Icon';
import { useSucursalActual } from '../../hooks/useSucursalActual';
import { waLink, msgGeneral } from '../../lib/whatsapp';

const CRUZ =
  'polygon(37% 0,63% 0,63% 37%,100% 37%,100% 63%,63% 63%,63% 100%,37% 100%,37% 63%,0 63%,0 37%,37% 37%)';

/** Banner de apertura con la propuesta de valor y CTAs. */
export function Banner() {
  const suc = useSucursalActual();

  return (
    <section id="inicio" className="relative overflow-hidden bg-azul text-white">
      {/* Cruz decorativa de marca */}
      <span
        aria-hidden="true"
        className="absolute -right-[60px] -top-[70px] size-[290px] bg-white opacity-[0.08]"
        style={{ clipPath: CRUZ }}
      />
      <div className="env relative z-[2] py-[clamp(26px,5vw,44px)]">
        <h1 className="max-w-[20ch]">Busca tu remedio y revisa si lo tenemos hoy</h1>
        <p className="mt-[11px] max-w-[52ch] text-[1.03rem] text-white/90">
          Cada local maneja su propio stock. Elige tu sucursal, arma tu pedido y lo dejamos apartado para retiro en
          tienda — sin pagos en línea.
        </p>
        <div className="mt-[22px] flex flex-wrap gap-2.5">
          <a
            href="#catalogo"
            className="btn btn-blanco flex-auto min-w-[210px] sm:flex-none"
          >
            <Icon id="i-lupa" /> Ver el catálogo
          </a>
          <a
            href={waLink(msgGeneral(suc), suc)}
            target="_blank"
            rel="noopener"
            className="btn btn-wa flex-auto min-w-[210px] sm:flex-none"
          >
            <Icon id="i-wa" /> Escríbenos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
