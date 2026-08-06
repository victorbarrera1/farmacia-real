# Farmacias Real

Catálogo digital informativo con **reserva de stock por WhatsApp** y retiro en tienda
para Farmacias Real (4 sucursales en Independencia y Ñuñoa).

Migrado de un `index.html` monolítico a **React 19 + TypeScript + Vite 7 + Tailwind CSS v4**,
con arquitectura modular pensada para crecer (catálogo real vía API, backend, etc.).
Íconos con **lucide-react**; ruteo con **react-router-dom v7**.

## Modelo de operación (restricciones del proyecto)

Este sitio **no es una tienda de e-commerce**. Es un catálogo informativo con reserva
previa de stock, conforme a la normativa sanitaria chilena (Código Sanitario,
DS 466/1984, ISP / MINSAL):

- **Sin pasarelas de pago.** No hay Webpay, Transbank, Mercado Pago, Stripe ni pago con
  tarjeta. El pago es 100% presencial en la caja del local.
- **Sin despacho a domicilio.** No hay formulario de dirección de entrega ni cálculo de
  envío. El retiro es 100% presencial.
- **Flujo carrito → WhatsApp.** El CTA del resumen es *"Cotizar / Reservar por WhatsApp"*
  y abre `wa.me/<whatsapp de la sucursal>` con productos, cantidades, total referencial,
  sucursal, dirección y el aviso de que el pago y la entrega son presenciales.
- **Publicidad de fármacos (Art. 100).** Los productos de venta directa muestran precio e
  información básica. Los que requieren receta se presentan de forma neutral e
  informativa: sin promociones ni ofertas, CTA sin color promocional
  (*"Reservar con receta"*), aviso de validación presencial por el Químico Farmacéutico,
  y el hero no promociona la categoría de medicamentos.

La sección **"Retiro en tienda y condiciones"** (`src/components/legal/Policies.tsx`) es un
modal accesible desde el pie de página, el aviso del catálogo, la ficha de producto y el
resumen de la reserva. Cubre: naturaleza de la plataforma, lugar de pago y entrega,
validación de recetas y disponibilidad de stock.

## Rutas

| Ruta | Página |
|------|--------|
| `/` | Tienda pública (catálogo + reserva por WhatsApp) |
| `/panel` | Panel de gestión (requiere clave) |

## Panel de gestión (`/panel`)

Acceso desde el botón **Admin** de la barra superior. Protegido con la clave
`ADMIN_PASS` de `src/config.ts` (por defecto `real2025`) y sesión de 12 h en
localStorage.

> ⚠️ La validación es en el navegador, así que la clave viaja en el bundle: sirve para
> evitar entradas accidentales, **no** como control de acceso real. Los puntos de
> integración están marcados con `// TODO(api)` para mover la autenticación al backend.

Pestañas:

| Pestaña | Qué hace |
|---------|----------|
| **Resumen** | KPIs reales sobre el stock del panel (valor, unidades, stock bajo, quiebres), inventario por categoría, estado del stock, alertas de reposición y demanda desde el historial local (con estado "sin datos"). Filtro consolidado / por sucursal. |
| **Productos** | CRUD completo: `n`, `pres`, `lab`, `act`, `cat` (6 categorías), `il` (selector de ilustración), `p`, `desc`, switches `be`/`rec`/`frio` y stock por sucursal. Incluye "Restaurar catálogo". |
| **Sucursales** | CRUD completo: nombre, corto, comuna, dirección, teléfono, WhatsApp, editor de horarios por tramos y consulta de mapa. Incluye "Restaurar sucursales". |
| **Stock** | Matriz editable producto × sucursal. Escribe en la misma fuente que consume la tienda. |
| **Pedidos** | Historial local de reservas enviadas por WhatsApp (productos, cantidades, total, sucursal, fecha) con KPIs y borrado. |

**Todo es cliente-side**: las ediciones del panel se ven de inmediato en la tienda y se
persisten en localStorage. Sin backend todavía; los enganches de API están marcados con
`// TODO(api)`.

### Alineación de `st[]` (invariante central)

`producto.st` es un array alineado **por posición** con las sucursales
(`st[0]` = primera sucursal, etc.). `src/data/repo.ts` mantiene el invariante:

- Crear una sucursal → agrega una posición con `0` en todos los productos.
- Eliminar una sucursal → quita esa posición en todos los productos.
- No se permite quedar sin sucursales.

### Claves de localStorage

| Clave | Contenido |
|-------|-----------|
| `fr_estado` | Sucursal elegida + reserva en curso (tienda) |
| `fr_admin_productos` | Catálogo editado en el panel |
| `fr_admin_sucursales` | Sucursales editadas en el panel |
| `fr_admin_pedidos` | Historial local de reservas enviadas |
| `fr_admin_sesion` | Sesión del panel (con vencimiento) |

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
├─ config.ts              ADMIN_PASS, claves de localStorage, umbral de stock bajo
├─ types.ts               Tipos del dominio (contrato único)
├─ data/
│  ├─ sucursales.ts       Datos originales de los 4 locales
│  ├─ categorias.ts       Categorías del catálogo
│  ├─ productos.ts        Catálogo original (30 productos)
│  └─ repo.ts             Fuente en runtime: datos originales + ediciones del panel,
│                         CRUD, reindexado de st[] y suscripción para React
├─ lib/                   Lógica pura, sin React
│  ├─ format.ts           clp(), sinTildes()
│  ├─ horarios.ts         estaAbierto(), textoHoy()
│  ├─ stock.ts            stockDe(), nivelDe(), etStock(), otrosLocalesCon()
│  ├─ pedido.ts           itemsPedido(), totalPedido(), cantidadPedido()
│  ├─ whatsapp.ts         waLink() y armado de mensajes de reserva
│  └─ pedidosLog.ts       Historial local de reservas enviadas
├─ store/                 Estado global (useReducer + Context + localStorage)
├─ hooks/                 useDatos (useProductos/useSucursales/usePedidosRegistrados),
│                         useCatalogo, useSucursalActual, useMediaQuery,
│                         useDragToClose, useStickyOffset
├─ pages/
│  ├─ Storefront.tsx      Página pública
│  └─ panel/              Panel de gestión
│     ├─ Panel.tsx        Login + pestañas + resumen
│     ├─ Login.tsx · useAdminSesion.ts
│     ├─ ProductosAdmin.tsx · ProductoForm.tsx
│     ├─ SucursalesAdmin.tsx · SucursalForm.tsx
│     ├─ StockTable.tsx · PedidosAdmin.tsx
│     ├─ metrics.ts       KPIs sobre el stock real (puro)
│     ├─ analytics.ts     Series y rankings desde el historial local
│     ├─ KpiTiles · StockStatus · CategoryBars · AlertsPanel
│     ├─ SalesTrend · RankingBars · ScopeFilter · PanelHeader
│     └─ charts/AreaChart.tsx
├─ components/
│  ├─ icons/              <Icon> (lucide) + <Ilu> (sprite) + SvgSprite
│  ├─ common/             Logo, Sello, SectionHeader, LiveAnnouncer
│  ├─ layout/             TopBar, Header, SearchBox, BranchPicker, BranchBar,
│  │                      CategoryNav, MegaMenu, Footer
│  ├─ sections/           Banner (hero + accesos), Steps, Services, Location
│  ├─ catalog/            Catalog, FiltersRow, ProductCard, ProductModal, EmptyState
│  ├─ branches/           Branches, BranchCard
│  ├─ order/              Drawer, OrderDrawer, BranchDrawer, FloatingWa, MobileOrderBar
│  ├─ legal/              Policies (modal de políticas + PoliciesLink)
│  └─ seo/                StructuredData (JSON-LD @type: Pharmacy)
├─ index.css              Sistema de diseño (tokens Tailwind v4 @theme)
├─ App.tsx · main.tsx
```

## Stock por sucursal (requisito central)

Toda la tienda funciona según el stock de la sucursal elegida. Al cambiarla se actualizan
catálogo, indicadores, el WhatsApp de destino y el título "Disponible en [sucursal]".
Si un producto no está en esa sucursal pero sí en otra, la tarjeta ofrece chips
"Sí hay en:" y el mensaje de WhatsApp propone apartarlo allá o traerlo al local elegido.

## Sistema de diseño

Todos los tokens (color, radios, sombras, tipografía) viven en `src/index.css` bajo
`@theme`. Paleta de marca: **azul marino + rojo sobre blanco** (sin verdes ajenos a la
marca; el verde solo se usa para WhatsApp y el estado "disponible").

**Escala de radios (regla concéntrica `r_interno = r_externo − padding`):**

| Elemento                     | Radio            |
|------------------------------|------------------|
| Tarjeta (externo)            | `rounded-2xl` 20px |
| Media anidada (inset 12px)   | `rounded-md` 8px (20−12) |
| Cajas de ícono / botones     | `rounded-lg` 12px |
| Sellos flotantes             | `rounded-sm` 6px  |
| Chips / pills                | `rounded-full`    |

## Cómo actualizar el contenido

Lo habitual es hacerlo desde **/panel** (queda en el navegador). Para cambiar los datos
de fábrica del repositorio:

- **Sucursales / horarios / WhatsApp:** `src/data/sucursales.ts`
- **Productos y stock:** `src/data/productos.ts` (`st` = unidades por sucursal, en el
  mismo orden que `SUCURSALES`)
- **Categorías:** `src/data/categorias.ts`

El emblema del logo es una aproximación en SVG (`src/components/icons/SvgSprite.tsx`,
id `i-emblema`); reemplazar por el archivo original cuando el dueño lo entregue.

## Accesibilidad

Región `aria-live` para anuncios, `aria-pressed` en filtros, skip-link, foco visible,
`prefers-reduced-motion`, drag-to-close en cajones móviles, sticky offset medido,
mega-menú con `aria-expanded`/Escape/clic fuera y modales con `role="dialog"`,
`aria-modal` y cierre por Escape en capas (la capa superior no cierra la de abajo).

## Referencia

El diseño original monolítico se conservó en `legacy/index.original.html`.
