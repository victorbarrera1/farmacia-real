import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Boxes, Loader2, MapPin, Package, ReceiptText, ShoppingCart, Store, type LucideIcon,
} from 'lucide-react';
import { SvgSprite } from '../../components/icons/SvgSprite';
import { PanelHeader } from './PanelHeader';
import { PanelEstado } from './PanelEstado';
import { Login } from './Login';
import { useAdminSesion, type ModoSesion } from './useAdminSesion';
import { ScopeFilter } from './ScopeFilter';
import { KpiTiles } from './KpiTiles';
import { CategoryBars } from './CategoryBars';
import { StockStatus } from './StockStatus';
import { AlertsPanel } from './AlertsPanel';
import { StockTable } from './StockTable';
import { SalesTrend } from './SalesTrend';
import { RankingBars } from './RankingBars';
import { ProductosAdmin } from './ProductosAdmin';
import { CatalogoIO } from './CatalogoIO';
import { SucursalesAdmin } from './SucursalesAdmin';
import { PedidosAdmin } from './PedidosAdmin';
import { resumen, porCategoria, alertas, type Scope } from './metrics';
import { porSucursal, topPedidos } from './analytics';
import { usePedidosRegistrados, useProductos, useSucursales } from '../../hooks/useDatos';

type Pestana = 'resumen' | 'productos' | 'sucursales' | 'stock' | 'pedidos';

const PESTANAS: { id: Pestana; et: string; ico: LucideIcon }[] = [
  { id: 'resumen', et: 'Resumen', ico: BarChart3 },
  { id: 'productos', et: 'Productos', ico: Package },
  { id: 'sucursales', et: 'Sucursales', ico: MapPin },
  { id: 'stock', et: 'Stock', ico: Boxes },
  { id: 'pedidos', et: 'Pedidos', ico: ReceiptText },
];

/** Panel de gestión: protegido por clave y dividido en pestañas. */
export function Panel() {
  const { autorizado, modo, entrar, salir } = useAdminSesion();

  useEffect(() => {
    document.title = 'Panel de gestión · Farmacias Real';
  }, []);

  if (autorizado === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-fondo">
        <p className="flex items-center gap-2.5 text-[0.95rem] font-semibold text-gris">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Verificando acceso…
        </p>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <>
        <SvgSprite />
        <Login modo={modo} onEntrar={entrar} />
      </>
    );
  }

  return <PanelAdmin modo={modo} onSalir={salir} />;
}

function PanelAdmin({ modo, onSalir }: { modo: ModoSesion; onSalir: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('resumen');

  return (
    <div className="min-h-screen bg-fondo pb-16">
      <SvgSprite />
      <PanelHeader onSalir={onSalir} />

      <div className="border-b border-linea bg-white">
        <div className="env">
          <div role="tablist" aria-label="Secciones del panel" className="flex gap-1 overflow-x-auto">
            {PESTANAS.map(({ id, et, ico: Ico }) => {
              const activa = id === pestana;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={activa}
                  aria-controls={`panel-${id}`}
                  onClick={() => setPestana(id)}
                  className={`flex min-h-[46px] shrink-0 items-center gap-2 border-b-[3px] px-3.5 text-[0.92rem] font-bold transition-colors ${
                    activa
                      ? 'border-rojo text-azul-osc'
                      : 'border-transparent text-gris hover:text-azul'
                  }`}
                >
                  <Ico className="size-[17px]" aria-hidden="true" /> {et}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="env py-6" id={`panel-${pestana}`} role="tabpanel" aria-labelledby={`tab-${pestana}`}>
        <PanelEstado modo={modo} />

        {pestana === 'resumen' && <Resumen />}
        {pestana === 'productos' && (
          <div className="flex flex-col gap-3">
            <ProductosAdmin />
            <CatalogoIO />
          </div>
        )}
        {pestana === 'sucursales' && <SucursalesAdmin />}
        {pestana === 'stock' && (
          <>
            <Titulo
              titulo="Control de stock"
              bajada="Matriz producto × sucursal. Lo que ajustes acá es exactamente lo que ve la tienda."
            />
            <StockTable />
          </>
        )}
        {pestana === 'pedidos' && (
          <>
            <Titulo
              titulo="Pedidos"
              bajada="Historial local de los pedidos armados en la tienda y enviados por WhatsApp."
            />
            <PedidosAdmin />
          </>
        )}
      </main>
    </div>
  );
}

function Titulo({ titulo, bajada }: { titulo: string; bajada: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em]">{titulo}</h1>
      <p className="mt-1 max-w-[70ch] text-[0.92rem] text-gris">{bajada}</p>
    </div>
  );
}

/** Pestaña de métricas, calculadas sobre el catálogo y el stock reales. */
function Resumen() {
  const productos = useProductos();
  const sucursales = useSucursales();
  const pedidos = usePedidosRegistrados();
  const [scope, setScope] = useState<Scope>('todas');

  const ambito =
    scope === 'todas' ? 'Todas las sucursales' : sucursales.find((s) => s.id === scope)?.corto ?? '';

  const r = useMemo(() => resumen(productos, sucursales, scope), [productos, sucursales, scope]);
  const cats = useMemo(() => porCategoria(productos, sucursales, scope), [productos, sucursales, scope]);
  const items = useMemo(() => alertas(productos, sucursales, scope), [productos, sucursales, scope]);
  const rankPedidos = useMemo(() => topPedidos(pedidos, 7), [pedidos]);
  const rankSucursales = useMemo(() => porSucursal(pedidos), [pedidos]);

  return (
    <>
      <Titulo
        titulo="Resumen de inventario"
        bajada="Valor, unidades, stock bajo y quiebres calculados sobre el stock real. La demanda sale del historial de reservas enviadas por WhatsApp; si no hay ninguna, se muestra «sin datos»."
      />

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

        <div className="mt-3 mb-1 flex items-end justify-between gap-4">
          <h2 className="text-[1.15rem] font-extrabold tracking-[-0.02em]">Demanda (historial local)</h2>
          <span className="text-[0.8rem] text-gris-2">
            {pedidos.length ? `${pedidos.length} pedidos registrados` : 'sin datos'}
          </span>
        </div>

        <SalesTrend />

        <div className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-2">
          <RankingBars
            titulo="Productos más pedidos"
            subtitulo="Unidades acumuladas en el historial local"
            icon={ShoppingCart}
            filas={rankPedidos}
            unidad="u."
            barra="bg-azul"
            vacio="Aparecerá cuando se envíen pedidos por WhatsApp desde la tienda."
          />
          <RankingBars
            titulo="Pedidos por sucursal"
            subtitulo="Cantidad de pedidos enviados por local"
            icon={Store}
            filas={rankSucursales}
            unidad="pedidos"
            barra="bg-frio"
            vacio="Aparecerá cuando se envíen pedidos por WhatsApp desde la tienda."
          />
        </div>
      </div>
    </>
  );
}
