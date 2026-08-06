import { Icon } from '../icons/Icon';
import { MegaMenu } from './MegaMenu';
import { CATEGORIAS } from '../../data/categorias';
import { useStore } from '../../store/StoreContext';

/** Barra de categorías pegajosa (bajo la cabecera): mega-menú + accesos rápidos. */
export function CategoryNav() {
  const { estado, dispatch } = useStore();

  return (
    <nav
      aria-label="Categorías"
      className="sticky z-50 border-b border-linea bg-white"
      style={{ top: 'var(--top-nav)' }}
    >
      <div className="env">
        <div className="flex items-center gap-2 py-2">
          <MegaMenu />

          <div
            role="group"
            aria-label="Accesos rápidos por categoría"
            className="flex flex-1 gap-1.5 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORIAS.map((c) => {
              const activa = c.id === estado.categoria;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => dispatch({ type: 'categoria', id: c.id })}
                  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.92rem] transition-all ${
                    activa
                      ? 'border-transparent bg-azul-pale font-bold text-azul-osc'
                      : 'border-transparent bg-fondo font-semibold text-gris hover:bg-azul-pale hover:text-azul-osc'
                  }`}
                >
                  <Icon id={c.ico} className="size-[19px] shrink-0 text-azul" />
                  {c.et}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
