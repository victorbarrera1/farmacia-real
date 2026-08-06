import { useState } from 'react';
import {
  CloudCheck, CloudOff, HardDrive, Loader2, RefreshCw, ShieldAlert, TriangleAlert, Upload,
} from 'lucide-react';
import { descartarLocal, hayEdicionLocal, recargar, subirLocalAlServidor } from '../../data/repo';
import { whatsappRepetidos, whatsappValido } from '../../lib/dominio';
import { useSincronizacion, useSucursales } from '../../hooks/useDatos';
import type { ModoSesion } from './useAdminSesion';

/* Avisos de estado del panel: de dónde salen los datos, si se guardaron,
   qué falta configurar y qué datos del cliente siguen pendientes. */

function Aviso({
  tono, Ico, children,
}: {
  tono: 'ok' | 'info' | 'ambar' | 'rojo';
  Ico: typeof CloudCheck;
  children: React.ReactNode;
}) {
  const estilos = {
    ok: 'border-ok-pale bg-ok-pale text-[#0F5A33]',
    info: 'border-azul-borde bg-azul-pale text-azul-osc',
    ambar: 'border-ambar-borde bg-ambar-pale text-[#6B4A08]',
    rojo: 'border-rojo-borde bg-rojo-pale text-rojo-osc',
  }[tono];

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3 text-[0.88rem] leading-snug ${estilos}`}>
      <Ico className="size-[18px] shrink-0" aria-hidden="true" />
      <div className="min-w-[200px] flex-1">{children}</div>
    </div>
  );
}

export function PanelEstado({ modo }: { modo: ModoSesion }) {
  const { origen, guardando, error } = useSincronizacion();
  const sucursales = useSucursales();
  const [migrando, setMigrando] = useState(false);
  const [migracion, setMigracion] = useState<string | null>(null);
  const hayLocal = hayEdicionLocal();

  const repetidos = whatsappRepetidos(sucursales);
  const invalidos = sucursales.filter((s) => !whatsappValido(s.whatsapp));

  async function subir() {
    setMigrando(true);
    try {
      await subirLocalAlServidor();
      setMigracion('Listo: tus datos locales quedaron en el servidor.');
    } catch {
      setMigracion('No se pudo subir. Revisa la conexión e inténtalo otra vez.');
    }
    setMigrando(false);
  }

  return (
    <div className="mb-5 flex flex-col gap-2">
      {/* Origen de los datos */}
      {origen === 'api' ? (
        <Aviso tono="ok" Ico={CloudCheck}>
          <b className="font-extrabold">Datos en el servidor.</b> Lo que edites acá lo ven la tienda y cualquier
          dispositivo del equipo.
          {guardando && (
            <span className="ml-2 inline-flex items-center gap-1.5 font-bold">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> guardando…
            </span>
          )}
          <button
            type="button"
            onClick={() => { recargar().catch(() => undefined); }}
            className="ml-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ok/30 bg-white px-2.5 font-bold hover:border-ok"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" /> Recargar del servidor
          </button>
        </Aviso>
      ) : (
        <Aviso tono="info" Ico={HardDrive}>
          <b className="font-extrabold">Datos solo en este navegador.</b> Sin backend configurado, las ediciones
          viven en este equipo (localStorage) y no se comparten con la tienda vista desde otros dispositivos.
          Configura <code>KV_REST_API_URL</code> y <code>KV_REST_API_TOKEN</code> en Vercel para centralizarlas.
        </Aviso>
      )}

      {error && (
        <Aviso tono="rojo" Ico={CloudOff}>
          <b className="font-extrabold">{error}</b> Se recargó la versión del servidor para no dejar datos a medias.
        </Aviso>
      )}

      {/* Migración de las ediciones que quedaron en el navegador */}
      {origen === 'api' && hayLocal && (
        <Aviso tono="ambar" Ico={Upload}>
          <b className="font-extrabold">Tienes ediciones guardadas solo en este navegador.</b> Súbelas al servidor
          para que queden disponibles en todos los dispositivos, o descártalas y quédate con las del servidor.
          {migracion && <span className="ml-2 font-bold">{migracion}</span>}
          <span className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={subir}
              disabled={migrando}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-azul px-3 font-bold text-white hover:bg-azul-osc disabled:opacity-60"
            >
              {migrando && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              Subir al servidor
            </button>
            <button
              type="button"
              onClick={() => { descartarLocal(); setMigracion('Ediciones locales descartadas.'); }}
              className="inline-flex min-h-9 items-center rounded-lg border border-ambar-borde bg-white px-3 font-bold hover:border-ambar"
            >
              Descartar
            </button>
          </span>
        </Aviso>
      )}

      {/* Seguridad del acceso */}
      {modo === 'local' && (
        <Aviso tono="ambar" Ico={ShieldAlert}>
          <b className="font-extrabold">Acceso sin validación en servidor.</b> La clave se compara en el navegador:
          sirve para evitar entradas accidentales, no como control de acceso. Genera las variables con{' '}
          <code>npm run clave</code> y cárgalas en Vercel.
        </Aviso>
      )}

      {/* Datos que faltan del cliente */}
      {(repetidos.length > 0 || invalidos.length > 0) && (
        <Aviso tono="ambar" Ico={TriangleAlert}>
          <b className="font-extrabold">Revisar los WhatsApp de las sucursales.</b>{' '}
          {repetidos.length > 0 && (
            <>
              Hay números repetidos entre locales (
              {repetidos.map((r) => r.ids.join(' y ')).join('; ')}): las reservas de esos locales llegan al mismo
              teléfono.{' '}
            </>
          )}
          {invalidos.length > 0 && (
            <>Números con formato inválido en: {invalidos.map((s) => s.corto).join(', ')}. </>
          )}
          Corrígelos en la pestaña <b className="font-bold">Sucursales</b>.
        </Aviso>
      )}
    </div>
  );
}
