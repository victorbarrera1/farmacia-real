import { useId, useRef, useState } from 'react';
import type { PuntoSerie } from '../analytics';

const W = 720;
const H = 240;
const PAD = { t: 16, r: 12, b: 28, l: 12 };

/**
 * Gráfico de área de una serie temporal, con crosshair y tooltip en hover.
 * Escala uniforme (viewBox + width:100%), así que las coordenadas del viewBox
 * mapean linealmente a píxeles del contenedor.
 */
export function AreaChart({
  serie,
  formato = (n) => String(n),
}: {
  serie: PuntoSerie[];
  formato?: (n: number) => string;
}) {
  const gid = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [idx, setIdx] = useState<number | null>(null);

  const n = serie.length;
  const max = Math.max(1, ...serie.map((s) => s.valor)) * 1.15;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const base = H - PAD.b;

  const x = (i: number) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.t + (1 - v / max) * plotH;

  const linea = serie.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(s.valor)}`).join(' ');
  const area = `${linea} L${x(n - 1)},${base} L${x(0)},${base} Z`;

  const gridY = [0.25, 0.5, 0.75, 1].map((f) => PAD.t + f * plotH);
  const pasoEt = Math.max(1, Math.ceil(n / 7));

  function mover(e: React.PointerEvent) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const frac = (e.clientX - rect.left) / rect.width;
    setIdx(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
  }

  const activo = idx != null ? serie[idx] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label={`Tendencia de ventas: ${serie.map((s) => `${s.label} ${s.valor}`).join(', ')}`}
        onPointerMove={mover}
        onPointerLeave={() => setIdx(null)}
      >
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-azul)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-azul)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid recesivo */}
        {gridY.map((gy, i) => (
          <line key={i} x1={PAD.l} x2={W - PAD.r} y1={gy} y2={gy} stroke="var(--color-linea-2)" strokeWidth={1} />
        ))}

        <path d={area} fill={`url(#fill-${gid})`} />
        <path d={linea} fill="none" stroke="var(--color-azul)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* etiquetas del eje X */}
        {serie.map((s, i) =>
          i % pasoEt === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-gris-2" style={{ fontSize: 11 }}>
              {s.label}
            </text>
          ) : null,
        )}

        {/* crosshair + punto activo */}
        {activo && (
          <g>
            <line x1={x(idx!)} x2={x(idx!)} y1={PAD.t} y2={base} stroke="var(--color-azul-borde)" strokeWidth={1.5} />
            <circle cx={x(idx!)} cy={y(activo.valor)} r={5} fill="var(--color-azul)" stroke="#fff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {activo && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-linea bg-white px-3 py-1.5 shadow-hi"
          style={{ left: `${(x(idx!) / W) * 100}%`, top: `${(y(activo.valor) / H) * 100}%` }}
        >
          <div className="text-[0.72rem] font-semibold text-gris-2">{activo.label}</div>
          <div className="num text-[0.95rem] font-extrabold text-texto">{formato(activo.valor)}</div>
        </div>
      )}
    </div>
  );
}
