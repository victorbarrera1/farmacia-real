import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Icon } from '../../components/icons/Icon';
import { useSucursales } from '../../hooks/useDatos';
import type { ModoSesion } from './useAdminSesion';

/** Pantalla de acceso al panel de gestión. */
export function Login({
  modo,
  sucursalesConClave,
  onEntrar,
}: {
  modo: ModoSesion;
  /** Ids de sucursal con clave propia; vacío = solo admin general. */
  sucursalesConClave: string[];
  /** Devuelve el mensaje de error, o null si la clave era correcta. */
  onEntrar: (clave: string, sucursalId?: string) => Promise<string | null>;
}) {
  const sucursales = useSucursales();
  const [clave, setClave] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  /* Solo ofrecemos las sucursales que tienen clave configurada. */
  const conClave = sucursales.filter((s) => sucursalesConClave.includes(s.id));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    const fallo = await onEntrar(clave, sucursalId || undefined);
    setError(fallo);
    if (fallo) setClave('');
    setEnviando(false);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-fondo px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-5 flex justify-center">
          <Logo showTagline={false} />
        </div>

        <form onSubmit={enviar} className="card p-6">
          <span className="grid size-12 place-items-center rounded-lg bg-azul-pale text-azul">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-3.5 text-[1.35rem] font-extrabold tracking-[-0.02em]">Panel de gestión</h1>
          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-gris">
            Acceso restringido al equipo de Farmacias Real. Ingresa la clave para administrar catálogo, sucursales y
            stock.
          </p>

          {modo === 'sin-configurar' ? (
            <div className="mt-4 rounded-lg border border-ambar-borde bg-ambar-pale px-4 py-3 text-[0.88rem] leading-relaxed text-[#6B4A08]">
              <b className="font-extrabold">Acceso no configurado.</b> Este despliegue no tiene backend ni clave
              local. Configura <code>ADMIN_PASS_HASH</code> y <code>ADMIN_SESSION_SECRET</code> en Vercel
              (<code>npm run clave</code> los genera).
            </div>
          ) : (
            <>
              {conClave.length > 0 && (
                <>
                  <label htmlFor="alcance" className="mt-5 block text-[0.86rem] font-bold text-texto">
                    ¿Con qué cuenta entras?
                  </label>
                  <select
                    id="alcance"
                    value={sucursalId}
                    onChange={(e) => { setSucursalId(e.target.value); setError(null); }}
                    className="mt-1.5 h-11 w-full rounded-lg border border-linea bg-white px-3 text-[0.92rem] focus:border-azul focus:outline-none"
                  >
                    <option value="">Administración general (todas las sucursales)</option>
                    {conClave.map((s) => (
                      <option key={s.id} value={s.id}>Sucursal {s.corto}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[0.76rem] text-gris-2">
                    Cada local edita solo su stock, sus precios y su visibilidad.
                  </span>
                </>
              )}

              <label htmlFor="clave" className="mt-4 block text-[0.86rem] font-bold text-texto">
                Clave de acceso
              </label>
              <div className="relative mt-1.5 flex items-center">
                <input
                  id="clave"
                  type={ver ? 'text' : 'password'}
                  value={clave}
                  autoFocus
                  autoComplete="current-password"
                  onChange={(e) => { setClave(e.target.value); setError(null); }}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'errClave' : undefined}
                  className="field pl-3.5 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setVer((v) => !v)}
                  aria-label={ver ? 'Ocultar clave' : 'Mostrar clave'}
                  className="absolute right-2 grid size-9 place-items-center rounded-lg text-gris hover:bg-fondo"
                >
                  {ver ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
                </button>
              </div>

              {error && (
                <p id="errClave" role="alert" className="mt-2 flex items-center gap-2 text-[0.86rem] font-bold text-rojo">
                  <ShieldAlert className="size-[16px] shrink-0" aria-hidden="true" /> {error}
                </p>
              )}

              <button type="submit" disabled={enviando} className="btn btn-azul btn-ancho mt-4 disabled:opacity-70">
                {enviando && <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />}
                {enviando ? 'Verificando…' : 'Entrar al panel'}
              </button>
            </>
          )}

          <Link
            href="/"
            className="mt-3 flex min-h-11 items-center justify-center gap-2 text-[0.88rem] font-semibold text-gris no-underline hover:text-azul hover:underline"
          >
            <Icon id="i-flecha" className="size-4 rotate-180" /> Volver a la tienda
          </Link>
        </form>

        {/* Qué tan protegido está realmente este acceso */}
        {modo === 'api' ? (
          <p className="mt-4 flex items-start justify-center gap-2 text-center text-[0.78rem] leading-relaxed text-ok">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            La clave se valida en el servidor y la sesión viaja en una cookie HttpOnly.
          </p>
        ) : modo === 'local' ? (
          <p className="mt-4 text-center text-[0.78rem] leading-relaxed text-gris-2">
            Sin backend: la clave se compara en el navegador contra un hash. Evita entradas accidentales, pero{' '}
            <b className="font-bold">no es control de acceso real</b>. Configura las variables del servidor para
            protegerlo de verdad.
          </p>
        ) : null}
      </div>
    </div>
  );
}
