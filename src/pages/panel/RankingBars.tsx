import type { LucideIcon } from 'lucide-react';

export interface FilaRanking {
  id: string;
  nombre: string;
  sub: string;
  valor: number;
}

/** Ranking horizontal de productos por una métrica (una sola tonalidad). */
export function RankingBars({
  titulo, subtitulo, icon: Ico, filas, unidad, barra,
}: {
  titulo: string;
  subtitulo: string;
  icon: LucideIcon;
  filas: FilaRanking[];
  unidad: string;
  /** Clase de color de la barra (magnitud, una sola tonalidad). */
  barra: string;
}) {
  const max = Math.max(1, ...filas.map((f) => f.valor));

  return (
    <section className="card p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <Ico className="size-[18px] text-azul" aria-hidden="true" />
        <div>
          <h3 className="text-[1rem] font-extrabold">{titulo}</h3>
          <p className="mt-0.5 text-[0.82rem] text-gris">{subtitulo}</p>
        </div>
      </header>

      <ol className="flex flex-col gap-3">
        {filas.map((f, i) => (
          <li key={f.id} className="flex items-center gap-3">
            <span className="num w-4 shrink-0 text-right text-[0.82rem] font-bold text-gris-2">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[0.85rem] font-semibold text-texto">{f.nombre}</span>
                <span className="num shrink-0 text-[0.82rem] font-bold tabular-nums text-texto">
                  {f.valor.toLocaleString('es-CL')}
                  <span className="ml-1 font-normal text-gris-2">{unidad}</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-linea-2">
                <div
                  className={`h-full rounded-full ${barra} transition-[width] duration-500`}
                  style={{ width: `${Math.max((f.valor / max) * 100, 4)}%` }}
                  title={`${f.nombre}: ${f.valor} ${unidad}`}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
