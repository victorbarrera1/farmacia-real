import { Link } from 'react-router-dom';
import { Store, RotateCcw } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

/** Cabecera del panel de gestión. */
export function PanelHeader({ onRestablecer }: { onRestablecer: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-white shadow-[0_1px_0_var(--color-linea)]">
      <div className="env flex h-[58px] items-center gap-3">
        <Logo showTagline={false} />
        <span className="hidden items-center gap-2 border-l border-linea pl-3 text-[0.9rem] font-bold text-gris min-[560px]:flex">
          Panel de gestión
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onRestablecer}
            className="flex h-10 items-center gap-2 rounded-lg border border-linea bg-white px-3 text-[0.88rem] font-bold text-gris transition-colors hover:border-azul hover:text-azul"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span className="hidden min-[420px]:inline">Restablecer</span>
          </button>
          <Link
            to="/"
            className="flex h-10 items-center gap-2 rounded-lg bg-azul px-3.5 text-[0.88rem] font-bold text-white transition-colors hover:bg-azul-osc"
          >
            <Store className="size-4" aria-hidden="true" />
            <span className="hidden min-[420px]:inline">Ver tienda</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
