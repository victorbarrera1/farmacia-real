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
      className="sticky z-50 border-b border-linea/70 bg-white/95 backdrop-blur-md shadow-xs"
      style={{ top: 'var(--top-nav)' }}
    >
      <div className="env">
        <div className="flex items-center gap-2.5 py-2.5">
          <MegaMenu />

          <div
            role="group"
            aria-label="Accesos rápidos por categoría"
            className="flex flex-1 gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-36px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5"
          >
            {CATEGORIAS.map((c) => {
              const activa = c.id === estado.categoria;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => dispatch({ type: 'categoria', id: c.id })}
                  className={`flex min-h-[42px] shrink-0 items-center gap-2 rounded-full border px-4 text-[0.9rem] transition-all duration-200 ${
                    activa
                      ? 'border-azul bg-azul font-bold text-white shadow-md'
                      : 'border-slate-200/80 bg-slate-50 font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon id={c.ico} className={`size-[18px] shrink-0 ${activa ? 'text-white' : 'text-azul'}`} />
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
