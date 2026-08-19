# Farmacias Real

Catálogo digital informativo con **reserva de stock por WhatsApp** y retiro en tienda
para Farmacias Real (4 sucursales en Independencia y Ñuñoa).

**React 19 + TypeScript + Next.js 15 (App Router) + Tailwind CSS v4**, íconos con
lucide-react, y Route Handlers en `app/api/` apoyados por la lógica pura de
`src/server/`. El almacenamiento compartido usa Redis/KV; sin backend configurado, el
sitio conserva un modo local basado en `localStorage`.

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
- **Publicidad de fármacos (Art. 100).** Los productos de venta directa muestran precio.
  Los que requieren receta se presentan de forma neutral: sin promociones, CTA sin color
  promocional (*"Reservar con receta"*), **sin precio en el mensaje de WhatsApp**, aviso
  de validación presencial por el Químico Farmacéutico y sin publicidad promocional
  para medicamentos sujetos a receta.

La sección **"Retiro en tienda y condiciones"** (`src/components/legal/Policies.tsx`) es
un modal accesible desde el pie, el aviso del catálogo, la ficha de producto y el resumen
de la reserva.

## Rutas

| Ruta | Página |
|------|--------|
| `/` | Tienda pública (catálogo + reserva por WhatsApp) |
| `/panel` | Panel de gestión (requiere clave) |
| `/api/*` | Backend (ver [`docs/API.md`](docs/API.md)) |

## Los dos modos de funcionamiento

| | Con backend (recomendado) | Sin backend (solo desarrollo) |
|---|---|---|
| Datos | Redis/KV vía `api/` — compartidos entre dispositivos | localStorage del navegador que edita |
| Clave del panel | Validada en el servidor (scrypt) + cookie `HttpOnly` firmada | Hash PBKDF2 en el navegador, solo si defines `NEXT_PUBLIC_ADMIN_PASS_HASH`/`_SALT` (**no es control de acceso real**) |
| Roles | Admin general + una clave por sucursal | Solo admin |
| Reservas | `POST /api/pedidos`: el dueño ve las de todas las visitas | Solo las de ese navegador |

El cliente detecta el modo con `GET /api/estado` (`src/lib/api.ts`) y el panel lo dice en
pantalla. **Nunca queda a medias:** si falta configurar el backend, todo sigue andando en
modo local.

### Activar el backend (5 minutos)

```bash
# 1. Crear el almacén: Vercel → Storage → KV / Upstash Redis (plan gratis).
#    Inyecta KV_REST_API_URL y KV_REST_API_TOKEN solas.

# 2. Generar la clave del dueño y el secreto de sesión:
npm run clave -- "UnaClaveLargaYPropia"
#    → pegar ADMIN_PASS_HASH y ADMIN_SESSION_SECRET en
#      Vercel → Settings → Environment Variables

# 3. Generar una clave por sucursal (para los encargados):
npm run clave -- --sucursales
#    → pegar SUCURSAL_PASS_HASHES (JSON en una línea) y entregar a cada
#      encargado la clave que imprime en pantalla.

# 4. Redeploy. El panel dirá "Datos en el servidor".
```

La clave en texto plano no existe en el repositorio: solo su hash, y solo en
las variables de entorno del servidor.

La primera vez, el panel ofrece **subir al servidor** las ediciones que quedaron en
localStorage (o descartarlas).

Para desarrollo local: copiar `.env.example` a `.env` (con `ALMACEN=archivo` los datos
quedan en `.data/`). `npm run dev` (`next dev`) ya sirve tienda, panel y las rutas de
`app/api/*` juntos, así que no se necesita `vercel dev`.

> El hash del `ADMIN_PASS_HASH` usa `:` como separador (no `$`) porque los cargadores de
> `.env` interpretan `$algo` como interpolación de variables.

## Panel de gestión (`/panel`)

Acceso desde el botón **Admin** de la barra superior. En el login se elige la
cuenta: *administración general* o *sucursal* (las que tengan clave propia).

| Pestaña | Admin general | Encargado de local |
|---------|---------------|--------------------|
| **Resumen** | KPIs de inventario de todas las sucursales + demanda del historial de reservas | Lo mismo, acotado a su sucursal |
| **Productos** | CRUD completo + exportar/importar CSV, plantilla y respaldo JSON | Solo consulta |
| **Precios y visibilidad** | Cualquier sucursal (selector) | Su local: precio propio, unidades y mostrar/ocultar |
| **Stock** | Matriz producto × sucursal completa | Solo su columna |
| **Sucursales** | CRUD con editor de horarios, valida el WhatsApp | No la ve |
| **Pedidos** | Todas las reservas | Solo las de su sucursal |

El servidor vuelve a validar cada permiso (`api/_lib/auth.ts`): ocultar un botón
no es la protección, es solo la interfaz.

### Precio y visibilidad por sucursal

Cada producto tiene tres arrays alineados con las sucursales:

| Campo | Qué es | Defecto |
|---|---|---|
| `st[]` | unidades en ese local | `0` |
| `vis[]` | si se muestra en la tienda de ese local | `true` |
| `px[]` | precio propio del local; `null` = usa el precio de lista `p` | `null` |

El **precio efectivo** (`px[idx] ?? p`) se calcula en un solo lugar
(`precioEnPos` en `src/lib/dominio.ts`, con los envoltorios `precioDe` /
`visibleEn` en `src/lib/stock.ts`), así que tienda, panel, resumen del pedido y
mensaje de WhatsApp muestran siempre lo mismo. Un producto oculto en una
sucursal no aparece en su catálogo ni se ofrece en los chips "Sí hay en:".

### Alineación de `st[]`, `vis[]` y `px[]` (invariante central)

Los tres arrays están alineados **por posición** con las sucursales. El
invariante se mantiene en `src/lib/dominio.ts` —el **mismo módulo que usa el
servidor**—:

- Crear una sucursal → agrega una posición (`0` unidades, visible, sin precio propio).
- Eliminar una sucursal → quita esa posición conservando el resto **por id**.
- No se permite quedar sin sucursales (`409` en la API).

### Cargar el catálogo real

1. **Panel → Productos → Descargar plantilla** (o *Exportar CSV* para partir del
   catálogo actual). Separador `;` y BOM UTF-8: abre directo en Excel.
2. Editar en Excel/Sheets. Columnas: `nombre, presentacion, laboratorio,
   principio_activo` (o `activo`), `categoria, precio, bioequivalente, receta,
   frio, descripcion, ilustracion, id` y, por cada sucursal,
   `stock_<idSucursal>`, `precio_<idSucursal>` (vacío = precio de lista) y
   `visible_<idSucursal>` (`si`/`no`). Solo `nombre` es obligatorio; el `id` se
   genera desde el nombre si va vacío. La plantilla lista las categorías válidas.
3. **Importar CSV**: muestra qué leyó y qué problemas encontró (filas sin nombre,
   categorías inexistentes, precios ilegibles); reemplaza solo al confirmar, y el
   servidor sanea todo otra vez.
4. **Respaldo:** *Descargar respaldo JSON* antes de cualquier carga masiva (guarda
   productos, sucursales, stock, precios y visibilidad tal cual).
   *Restaurar respaldo* lo devuelve.

Si el panel del dueño es la única fuente, el respaldo JSON es la copia de seguridad:
conviene bajarlo periódicamente y guardarlo fuera del navegador.

## Scripts

```bash
npm install
npm run dev        # tienda + panel + API local (http://localhost:3000)
npm run build      # build de producción de Next.js
npm run typecheck
npm run test:api   # 44 pruebas: API + Perfumería + round-trip CSV, auth, CRUD,
                   # invariantes de st/vis/px, pedidos, importación y límites
npm run clave      # claves: admin, --sucursales (todas) o --sucursal <id>
npm run seo        # regenera JSON-LD + sitemap.xml + robots.txt desde src/data/
npm run og         # regenera public/og-farmacias-real.png (requiere Playwright)
```

## SEO

Los metadatos, canonical, Open Graph, Twitter Card y JSON-LD (`Organization` +
`WebSite` + 4 × `Pharmacy`) se publican desde `app/layout.tsx`. El grafo se genera a
partir de `src/data/sucursales.ts`; `StructuredData.tsx` lo reemplaza en runtime solo
si el panel modificó las sucursales. `public/robots.txt` bloquea `/panel` y `/api/`, y
`public/sitemap.xml` expone la portada.

**Ojo con el dominio:** `SITIO_URL` (en `src/config.ts`) es la URL canónica y hoy apunta
a `https://farmaciareal.vercel.app`. Conviene consolidar un único dominio, idealmente
propio. Al cambiarlo: editar `SITIO_URL` y correr `npm run seo`.

## Estructura

```
app/                        App Router: portada, /panel y Route Handlers /api/*
src/
├─ config.ts · types.ts     Configuración y contrato único del dominio
├─ data/                    Sucursales, categorías, 38 productos demo y repositorio
├─ lib/                     Dominio, CSV, stock, pedido, WhatsApp, SEO y utilidades
├─ server/                  Auth, almacenamiento y handlers puros de la API
├─ store/ · hooks/          Estado de tienda, sincronización y catálogo filtrado
├─ views/                   Storefront público search-first y panel administrativo
└─ components/              Layout, catálogo, sucursales, pedido, legal, iconos y SEO
pruebas/                    API y pruebas de dominio/CSV de Perfumería (node --test)
scripts/                    Claves, SEO e imagen Open Graph
docs/API.md                 Endpoints y contratos JSON
MASTER.md                   Decisiones visuales, responsive y política no-motion
```

## Datos pendientes del cliente

- **WhatsApp de Santa María 1789 y Simón Bolívar 3751.** Hoy usan el número de
  Independencia 1443 (`WHATSAPP_PENDIENTE` en `src/data/sucursales.ts`), así que las
  reservas de esos locales llegan al teléfono equivocado. El panel lo avisa en pantalla y
  `npm run seo` lo reporta. Se corrige en `src/data/sucursales.ts` o desde
  **/panel → Sucursales**.
- **Catálogo real.** Los 38 productos son de demostración (incluidos 8 de Perfumería): cargar el real por CSV.
- **Clave del panel.** La provisional es débil; cambiarla con `npm run clave`.
- **Emblema del logo.** Es una aproximación SVG (`SvgSprite.tsx`, id `i-emblema`):
  reemplazar por el archivo original cuando el dueño lo entregue.

## Stock por sucursal (requisito central)

Toda la tienda funciona según el stock de la sucursal elegida. Al cambiarla se actualizan
catálogo, indicadores, el WhatsApp de destino y el título "Disponible en [sucursal]".
Si un producto no está en esa sucursal pero sí en otra, la tarjeta ofrece chips
"Sí hay en:" y el mensaje de WhatsApp propone apartarlo allá o traerlo al local elegido.

## Sistema de diseño y storefront

La especificación consolidada está en [`MASTER.md`](MASTER.md). Los tokens viven en
`src/index.css`: azul marino y rojo de Farmacias Real sobre superficies blancas/pálidas;
el verde se reserva para WhatsApp y disponibilidad. Como la tipografía exacta de Cruz
Verde no pudo verificarse de forma concluyente ni licenciarse, se documentó la pila
neutral de retail `Arial, Helvetica, Roboto, sans-serif` en vez de atribuir una fuente
sin evidencia.

La portada es **search-first**: gate de ubicación de primera visita, cabecera compacta
con búsqueda y sucursal, catálogo inmediato, sucursales compactas y pie. En escritorio
(`>=1000px`) hay sidebar permanente de categorías y facetas; en móvil se separan el
cajón de categorías y el de filtros. La grilla usa una columna hasta 374 px, dos desde
375 px, tres desde 680 px y cuatro desde 1180 px cuando hay espacio junto al sidebar.
Perfumería cubre fragancias, colonias, desodorantes, cuidado corporal y sets de regalo.

**Política no-motion:** la tienda pública no usa GSAP, Reveal, carruseles, autoplay,
pulsos, parallax, smooth scrolling ni transiciones. Los drawers montan y desmontan de
forma instantánea. La regla `.tienda` en `src/index.css` fuerza `animation: none`,
`transition: none` y `scroll-behavior: auto`; el panel conserva únicamente indicadores
funcionales como sus spinners de carga.

## Accesibilidad

Se mantienen región `aria-live`, `aria-pressed`, skip-link, foco visible, objetivos
táctiles útiles de al menos 44 px, navegación de sugerencias por teclado, Escape y clic
en backdrop para overlays, foco inicial y `role="dialog"`/`aria-modal`. Los drawers
no permanecen ocultos como nodos de diálogo fuera de pantalla.

## Referencia

El diseño original monolítico se conservó en `legacy/index.original.html`.
