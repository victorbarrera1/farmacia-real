import { SUCURSALES } from '../../data/sucursales';
import type { Scope } from './metrics';

/** Selector de ámbito: consolidado o una sucursal. */
export function ScopeFilter({ scope, onChange }: { scope: Scope; onChange: (s: Scope) => void }) {
  const opciones: { id: Scope; et: string }[] = [
    { id: 'todas', et: 'Todas las sucursales' },
    ...SUCURSALES.map((s) => ({ id: s.id as Scope, et: s.corto })),
  ];

  return (
    <div role="group" aria-label="Ámbito de las métricas" className="flex flex-wrap gap-2">
      {opciones.map((o) => {
        const activa = o.id === scope;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(o.id)}
            className={`min-h-9 rounded-full border px-3.5 text-[0.85rem] font-semibold transition-colors ${
              activa
                ? 'border-transparent bg-azul text-white'
                : 'border-linea bg-white text-gris hover:border-azul hover:text-azul'
            }`}
          >
            {o.et}
          </button>
        );
      })}
    </div>
  );
}
