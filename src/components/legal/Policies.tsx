import { useEffect, useRef } from 'react';
import { BadgeCheck, Banknote, FileText, PackageSearch, Store } from 'lucide-react';
import { Icon } from '../icons/Icon';
import { useStore } from '../../store/StoreContext';

/* ================================================================
   CONDICIONES DEL CATÁLOGO Y TÉRMINOS DEL SERVICIO
   ----------------------------------------------------------------
   Cumplimiento normativa sanitaria chilena (Código Sanitario,
   DS 466/84 sobre farmacias, ISP / MINSAL):

   · La web es un catálogo informativo con cotización de stock, NO una
     tienda de venta a distancia: no hay pasarela de pago, ni carrito
     con checkout, ni despacho a domicilio.
   · El pago y la entrega son presenciales en el local autorizado.
   · Los medicamentos sujetos a receta se venden solo contra receta
     validada presencialmente por el Químico Farmacéutico de turno.
   · La información de productos con receta es neutral e informativa:
     sin publicidad inductiva, ofertas ni promociones (Art. 100).

   Accesible desde el pie de página y desde el resumen de cotización.
   ================================================================ */

const PUNTOS = [
  {
    Ico: PackageSearch,
    t: 'Naturaleza de la plataforma',
    d: 'Este sitio es un catálogo de información de productos y de cotización previa en la sucursal que elijas. No constituye una tienda de venta en línea: no se realizan transacciones ni se perfeccionan ventas a través de la web. Los precios publicados son referenciales e informativos, y pueden variar sin previo aviso.',
  },
  {
    Ico: Banknote,
    t: 'Lugar de pago y entrega',
    d: 'El pago y la entrega de los productos se efectúan de manera exclusiva y presencial en el mostrador del local físico autorizado. No usamos pasarelas de pago en línea (no hay pago con tarjeta, Webpay, Transbank ni similares) y no realizamos despacho a domicilio: el retiro es 100% presencial.',
  },
  {
    Ico: FileText,
    t: 'Validación de recetas médicas',
    d: 'La venta de medicamentos sujetos a la condición de venta bajo receta médica está condicionada a la presentación y verificación presencial de la receta —física o electrónica— por parte del Químico Farmacéutico de turno en la sucursal. Sin receta válida, no se puede realizar la entrega.',
  },
  {
    Ico: BadgeCheck,
    t: 'Disponibilidad y stock',
    d: 'La cotización por WhatsApp consulta una disponibilidad estimada según la información del sistema. El stock final y precio se confirman al momento de la atención presencial en el mostrador.',
  },
  {
    Ico: Store,
    t: 'Información de medicamentos',
    d: 'La información de los medicamentos con receta es meramente informativa y neutral: no publicamos promociones, ofertas ni publicidad inductiva sobre ellos, conforme a la normativa sanitaria vigente. Esta página no reemplaza la indicación de un profesional de la salud; ante cualquier síntoma, consulta a tu médico o al Químico Farmacéutico.',
  },
];

/** Modal con las condiciones del catálogo y términos del servicio. */
export function PoliciesModal() {
  const { estado, dispatch } = useStore();
  const refCerrar = useRef<HTMLButtonElement>(null);
  const abierto = estado.legal;

  useEffect(() => {
    if (!abierto) return;
    refCerrar.current?.focus();
    /* Capa superior: capturamos Escape antes que el cajón de abajo para que
       solo se cierre este modal (fase de captura + stopImmediatePropagation). */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      dispatch({ type: 'cerrarLegal' });
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [abierto, dispatch]);

  if (!abierto) return null;
  const cerrar = () => dispatch({ type: 'cerrarLegal' });

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center overflow-y-auto p-0 min-[720px]:items-center min-[720px]:p-6">
      <div className="fixed inset-0 bg-azul-osc/55" onClick={cerrar} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tLegal"
        className="relative z-10 max-h-[90dvh] w-full max-w-[760px] overflow-y-auto overscroll-contain rounded-t-2xl border border-linea bg-white shadow-hi pb-[env(safe-area-inset-bottom,0px)] min-[720px]:max-h-[88vh] min-[720px]:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-linea bg-white px-5 py-4">
          <div className="mr-auto">
            <h2 id="tLegal" className="text-[1.2rem] font-extrabold tracking-[-0.02em]">
              Retiro en tienda y condiciones
            </h2>
            <p className="mt-0.5 text-[0.85rem] text-gris">
              Condiciones del catálogo y términos del servicio
            </p>
          </div>
          <button
            ref={refCerrar}
            type="button"
            aria-label="Cerrar condiciones"
            onClick={cerrar}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-fondo text-gris hover:bg-linea hover:text-texto"
          >
            <Icon id="i-x" className="size-[17px]" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-start gap-3 rounded-xl border border-azul-borde bg-azul-pale px-4 py-3.5 text-[0.9rem] leading-relaxed text-azul-osc">
            <Icon id="i-alerta" className="mt-0.5 size-[19px] shrink-0 text-azul" />
            <p>
              <b className="font-extrabold">Catálogo informativo con cotización.</b> Farmacias Real usa este sitio para
              informar productos y cotizar por WhatsApp. <b className="font-extrabold">No hay pago en línea ni
              despacho a domicilio</b>: pagas y retiras presencialmente en el local.
            </p>
          </div>

          <ol className="mt-4">
            {PUNTOS.map(({ Ico, t, d }, i) => (
              <li key={t} className="flex gap-3.5 border-b border-linea-2 py-4 last:border-b-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fondo text-azul">
                  <Ico className="size-[20px]" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[1rem] font-extrabold">
                    {i + 1}. {t}
                  </h3>
                  <p className="mt-1 text-[0.92rem] leading-relaxed text-gris">{d}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-2 rounded-xl bg-fondo px-4 py-3.5 text-[0.82rem] leading-relaxed text-gris-2">
            Documento informativo para los clientes de Farmacias Real. Las condiciones se rigen por la normativa
            sanitaria chilena vigente (Código Sanitario, DS 466/1984 y normas del ISP / MINSAL sobre farmacias,
            recetas y publicidad de medicamentos). Última actualización: {new Date().getFullYear()}.
          </p>
        </div>

        <div className="sticky bottom-0 border-t border-linea bg-fondo px-5 py-4">
          <button type="button" onClick={cerrar} className="btn btn-azul btn-ancho">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

/** Enlace/botón reutilizable para abrir las políticas. */
export function PoliciesLink({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  const { dispatch } = useStore();
  return (
    <button type="button" onClick={() => dispatch({ type: 'abrirLegal' })} className={className}>
      {children ?? 'Condiciones del catálogo y términos'}
    </button>
  );
}
