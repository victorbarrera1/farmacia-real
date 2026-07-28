import { Icon } from '../icons/Icon';
import { CATEGORIAS } from '../../data/categorias';
import { useStore } from '../../store/StoreContext';

/** Barra de categorías pegajosa (bajo la cabecera). */
export function CategoryNav() {
  const { estado, dispatch } = useStore();

  return (
    <nav
      aria-label="Categorías"
      className="sticky z-50 border-b border-linea bg-white"
      style={{ top: 'var(--top-nav)' }}
    >
      <div className="env">
        <div
          role="group"
          className="flex gap-1.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    ? 'border-transparent bg-azul font-bold text-white'
                    : 'border-transparent bg-fondo font-semibold text-gris hover:bg-azul-pale hover:text-azul-osc'
                }`}
              >
                <Icon id={c.ico} className={`size-[19px] shrink-0 ${activa ? 'text-white' : 'text-azul'}`} />
                {c.et}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
