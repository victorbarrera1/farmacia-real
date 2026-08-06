import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Icon } from '../../components/icons/Icon';

/** Pantalla de acceso al panel de gestión. */
export function Login({ onEntrar }: { onEntrar: (clave: string) => boolean }) {
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const ok = onEntrar(clave);
    setError(!ok);
    if (!ok) setClave('');
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

          <label htmlFor="clave" className="mt-5 block text-[0.86rem] font-bold text-texto">
            Clave de acceso
          </label>
          <div className="relative mt-1.5 flex items-center">
            <input
              id="clave"
              type={ver ? 'text' : 'password'}
              value={clave}
              autoFocus
              autoComplete="current-password"
              onChange={(e) => { setClave(e.target.value); setError(false); }}
              aria-invalid={error}
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
              <ShieldAlert className="size-[16px] shrink-0" aria-hidden="true" /> Clave incorrecta. Intenta de nuevo.
            </p>
          )}

          <button type="submit" className="btn btn-azul btn-ancho mt-4">
            Entrar al panel
          </button>

          <Link
            to="/"
            className="mt-3 flex min-h-11 items-center justify-center gap-2 text-[0.88rem] font-semibold text-gris no-underline hover:text-azul hover:underline"
          >
            <Icon id="i-flecha" className="size-4 rotate-180" /> Volver a la tienda
          </Link>
        </form>

        <p className="mt-4 text-center text-[0.78rem] leading-relaxed text-gris-2">
          La clave se valida en el navegador (sin backend), por lo que sirve para evitar entradas accidentales, no
          como control de acceso real. Se configura en <code>src/config.ts</code>.
        </p>
      </div>
    </div>
  );
}
