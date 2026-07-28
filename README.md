# Farmacias Real

E-commerce de catálogo con retiro en tienda y pedidos por WhatsApp para
Farmacias Real (4 sucursales en Independencia y Ñuñoa).

Migrado de un `index.html` monolítico a **React + TypeScript + Vite + Tailwind CSS v4**,
con arquitectura modular pensada para crecer (catálogo real vía API, carrito,
backend, etc.). Íconos con **lucide-react**; ruteo con **react-router-dom**.

## Rutas

| Ruta | Página |
|------|--------|
| `/` | Tienda pública (catálogo + pedido por WhatsApp) |
| `/panel` | Panel de gestión: control de stock y métricas (datos simulados) |

El acceso al panel está en el botón **Test** de la barra superior. El panel
simula control de inventario editable por sucursal (persistido en localStorage,
clave `fr_panel_stock`) y métricas: KPIs, inventario por categoría, estado del
stock, alertas de reposición, tendencia de ventas, y rankings de productos más
pedidos y más vistos. Los datos de demanda son simulados (`pages/panel/analytics.ts`).

## Scripts

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # typecheck + build de producción (dist/)
npm run preview  # previsualizar el build
npm run typecheck
```

## Estructura

```
src/
├─ data/                 Datos editables (la fuente a reemplazar por API)
│  ├─ sucursales.ts      Locales, horarios y WhatsApp
│  ├─ categorias.ts      Categorías del catálogo
│  └─ productos.ts       Catálogo (con stock por sucursal)
├─ types.ts              Tipos del dominio (contrato único)
├─ lib/                  Lógica pura, sin React
│  ├─ format.ts          clp(), sinTildes()
│  ├─ horarios.ts        estaAbierto(), textoHoy()
│  ├─ stock.ts           stockDe(), nivelDe(), otrosLocalesCon()
│  ├─ pedido.ts          itemsPedido(), totalPedido(), cantidadPedido()
│  └─ whatsapp.ts        waLink() y armado de mensajes
├─ store/                Estado global (useReducer + Context + localStorage)
│  ├─ state.ts           AppState, carga/guardado
│  ├─ reducer.ts         acciones y transiciones
│  └─ StoreContext.tsx   Provider + hook useStore()
├─ hooks/                useCatalogo, useSucursalActual, useMediaQuery,
│                        useDragToClose, useStickyOffset
├─ pages/
│  ├─ Storefront.tsx     Página pública (tienda)
│  └─ panel/             Panel de gestión (control de stock + métricas)
│     ├─ Panel.tsx       Composición del panel
│     ├─ metrics.ts      Cálculo de KPIs / categorías / alertas (puro)
│     ├─ analytics.ts    Demanda simulada (ventas, vistas, tendencia)
│     ├─ useStockSimulado.ts   Stock editable persistido
│     ├─ KpiTiles · StockStatus · CategoryBars · AlertsPanel · StockTable
│     ├─ SalesTrend · RankingBars · ScopeFilter · PanelHeader
│     └─ charts/AreaChart.tsx  Área temporal con hover
├─ components/
│  ├─ icons/             <Icon> (lucide) + <Ilu> (sprite) + SvgSprite
│  ├─ common/            Logo, Sello, SectionHeader, LiveAnnouncer
│  ├─ layout/            TopBar, Header, SearchBox, BranchBar, CategoryNav, Footer
│  ├─ sections/          Banner, Steps, Services, Location
│  ├─ catalog/           Catalog, FiltersRow, ProductCard, EmptyState
│  ├─ branches/          Branches, BranchCard
│  ├─ order/             Drawer, OrderDrawer, BranchDrawer, FloatingWa, MobileOrderBar
│  └─ seo/               StructuredData (JSON-LD)
├─ index.css            Sistema de diseño (tokens Tailwind v4 @theme)
├─ App.tsx              Composición de la página
└─ main.tsx            Punto de entrada
```

## Sistema de diseño

Todos los tokens (color, radios, sombras, tipografía) viven en `src/index.css`
bajo `@theme`. La página se armoniza desde ahí.

**Escala de radios (regla concéntrica `r_interno = r_externo − padding`):**

| Elemento                     | Radio            |
|------------------------------|------------------|
| Tarjeta (externo)            | `rounded-2xl` 20px |
| Media anidada (inset 12px)   | `rounded-md` 8px (20−12) |
| Cajas de ícono / botones     | `rounded-lg` 12px |
| Sellos flotantes             | `rounded-sm` 6px  |
| Chips / pills                | `rounded-full`    |

## Cómo actualizar el contenido

- **Sucursales / horarios / WhatsApp:** `src/data/sucursales.ts`
- **Productos y stock:** `src/data/productos.ts` (`st` = unidades por sucursal,
  en el mismo orden que `SUCURSALES`)
- **Categorías:** `src/data/categorias.ts`

El emblema del logo es una aproximación en SVG (`src/components/icons/SvgSprite.tsx`,
id `i-emblema`); reemplazar por el archivo original cuando el dueño lo entregue.

## Referencia

El diseño original monolítico se conservó en `legacy/index.original.html`.
