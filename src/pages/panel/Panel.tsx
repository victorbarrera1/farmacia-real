import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, MousePointerClick } from 'lucide-react';
import { SvgSprite } from '../../components/icons/SvgSprite';
import { PanelHeader } from './PanelHeader';
import { ScopeFilter } from './ScopeFilter';
import { KpiTiles } from './KpiTiles';
import { CategoryBars } from './CategoryBars';
import { StockStatus } from './StockStatus';
import { AlertsPanel } from './AlertsPanel';
import { StockTable } from './StockTable';
import { SalesTrend } from './SalesTrend';
import { RankingBars } from './RankingBars';
import { useStockSimulado } from './useStockSimulado';
import { resumen, porCategoria, alertas, type Scope } from './metrics';
import { topPedidos, topVistos } from './analytics';
import { SUCURSALES } from '../../data/sucursales';

/** Panel de gestión: control de stock y métricas (datos simulados). */
export function Panel() {
  const { stock, fijar, ajustar, restablecer } = useStockSimulado();
  const [scope, setScope] = useState<Scope>('todas');

  useEffect(() => {
    document.title = 'Panel de gestión · Farmacias Real';
  }, []);

  const ambito = scope === 'todas' ? 'Todas las sucursales' : SUCURSALES.find((s) => s.id === scope)?.corto ?? '';
  const r = useMemo(() => resumen(stock, scope), [stock, scope]);
  const cats = useMemo(() => porCategoria(stock, scope), [stock, scope]);
  const items = useMemo(() => alertas(stock, scope), [stock, scope]);

  const pedidos = useMemo(
    () => topPedidos(7).map((d) => ({ id: d.p.id, nombre: d.p.n, sub: d.p.lab, valor: d.ventas })),
    [],
  );
  const vistos = useMemo(
    () => topVistos(7).map((d) => ({ id: d.p.id, nombre: d.p.n, sub: d.p.lab, valor: d.vistas })),
    [],
  );

  return (
    <div className="min-h-screen bg-fondo pb-16">
      <SvgSprite />
      <PanelHeader onRestablecer={restablecer} />

      <main className="env py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">Control de inventario</h1>
            <p className="mt-1 max-w-[60ch] text-[0.92rem] text-gris">
              Métricas y gestión de stock por sucursal. Los datos son una simulación para demostración; las
              ediciones se guardan solo en este navegador.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <ScopeFilter scope={scope} onChange={setScope} />
        </div>

        <div className="flex flex-col gap-3">
          <KpiTiles r={r} ambito={ambito} />

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <CategoryBars filas={cats} ambito={ambito} />
            </div>
            <div className="flex flex-col gap-3">
              <StockStatus r={r} ambito={ambito} />
              <AlertsPanel items={items} ambito={ambito} />
            </div>
          </div>

          {/* Analítica de demanda (datos simulados) */}
          <div className="mt-3 mb-1 flex items-end justify-between gap-4">
            <h2 className="text-[1.15rem] font-extrabold tracking-[-0.02em]">Analítica de demanda</h2>
            <span className="text-[0.8rem] text-gris-2">Datos simulados · consolidado</span>
          </div>

          <SalesTrend />

          <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-2">
            <RankingBars
              titulo="Productos más pedidos"
              subtitulo="Unidades vendidas · últimos 30 días"
              icon={ShoppingCart}
              filas={pedidos}
              unidad="u."
              barra="bg-azul"
            />
            <RankingBars
              titulo="Productos más vistos"
              subtitulo="Clics en la ficha · últimos 30 días"
              icon={MousePointerClick}
              filas={vistos}
              unidad="vistas"
              barra="bg-frio"
            />
          </div>

          <StockTable stock={stock} fijar={fijar} ajustar={ajustar} />
        </div>
      </main>
    </div>
  );
}
