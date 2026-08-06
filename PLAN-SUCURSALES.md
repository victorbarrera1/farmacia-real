# PLAN DE IMPLEMENTACIÓN — Panel por sucursal, importación Excel y seguridad

> Documento de trabajo para el modelo encargado del desarrollo. Léelo completo
> antes de tocar código: **el backend ya existe, está conectado y probado**.
> No se debe reconstruir nada de cero; se activa y se extiende.

---

## 0) ESTADO ACTUAL (verificado — no rehacer)

La app **ya tiene una API serverless completa** en `api/`, conectada a la SPA:

- `api/_lib/auth.ts` — autenticación real en servidor: hash **scrypt** en
  `ADMIN_PASS_HASH` (la clave nunca viaja al bundle), token **HMAC-SHA256** en
  cookie **HttpOnly + SameSite=Lax (+Secure)** `fr_sesion`, límite de 10
  intentos/15 min por IP. Se genera todo con `npm run clave`.
- `api/_lib/almacen.ts` — persistencia con 2 drivers: **Redis REST** (Vercel KV /
  Upstash, producción) o **JSON en `.data/`** (dev/test). Sin configurar →
  API en modo lectura (sirve datos de fábrica).
- Endpoints: `sesion` (login/logout/check), `catalogo` (GET público; PUT admin =
  reemplazo completo, sirve para importar; POST restaurar), `productos`
  (GET/PUT/DELETE), `sucursales` (GET/PUT/DELETE con invariante de `st[]`),
  `stock` (PATCH fija o suma/resta por `sucursalId`), `pedidos` (POST público,
  GET/DELETE admin), `estado` (capacidades del backend, sin secretos).
- `src/lib/dominio.ts` — saneamiento y CRUD **puro y compartido** entre navegador
  y servidor. `src/lib/api.ts` — cliente con detección de backend y errores
  humanos. `src/data/repo.ts` — external store con origen `api|local`,
  escrituras optimistas + revert si el servidor rechaza.
- La SPA ya está cableada: login contra `POST /api/sesion`, catálogo contra
  `/api/catalogo`, CRUD de productos/sucursales/stock contra la API, pedidos
  contra `/api/pedidos`. Sin variables de entorno, todo cae a modo local
  (localStorage) y el sitio sigue funcionando.
- **Pruebas**: `npm run test:api` → 25/25 pasan (auth, CRUD, invariante de
  `st[]`, pedidos, límite de intentos). Typecheck y build pasan.
- Pestañas del panel: Productos, Stock, Sucursales, Pedidos, Análisis
  (con `SalesTrend` alimentada por datos demo, no por ventas reales todavía).

### Lo que falta para producción/demo completa

1. **Activar el backend**: definir las variables de entorno en Vercel (Fase 0).
2. **Login por sucursal** — hoy hay UNA sola credencial de admin (Fase 1).
3. **Personalización por sucursal**: stock propio (ya existe vía `st[]` y
   `PATCH /api/stock`), pero **no** hay visibilidad por sucursal ni **precios
   especiales/descuentos por sucursal** (el precio `p` es global) (Fase 1).
4. **Importación desde Excel/CSV** — el contrato `PUT /api/catalogo` ya lo
   soporta (reemplazo completo), pero no hay UI que lo haga (Fase 2).
5. Números WhatsApp reales de Santa María y Ñuñoa (`src/data/sucursales.ts:51,62`).
6. Analítica alimentada con ventas reales (hay `GET /api/pedidos` con eso).

---

## 1) SEGURIDAD DEL PANEL (pregunta respondida)

El panel **puede quedarse en `/panel`** sin problema **si la autenticación es de
servidor**, que ya lo es. Reglas que se mantienen:

- La clave nunca se compara en el navegador. El fallback PBKDF2
  (`src/config.ts` → `CLAVE_LOCAL`) es solo para que el panel no quede
  inaccesible sin backend; **se borra al activar la API**.
- No depender de ruta oculta: `/panel` por nombre no es seguridad, la cookie
  HttpOnly + el chequeo server-side sí lo son.
- La cookie `fr_sesion` no la lee JavaScript (anti-XSS). El límite de intentos
  frena fuerza bruta. Todo esto ya está implementado y testeado.
- Opciones adicionales (opcionales, no bloqueantes): cabecera CSP estricta en
  Vercel, y en el futuro migrar a **Supabase Auth + RLS** cuando haya luz verde
  (ver §5). Para la maqueta no hace falta.

---

## 2) FASE 0 — ACTIVAR LO QUE YA EXISTE (30 min)

1. En el proyecto Vercel → Settings → Environment Variables:
   - `ADMIN_PASS_HASH` y `ADMIN_SESSION_SECRET` generados con `npm run clave`.
     Usar una clave real (≥ 10 caracteres, con números y símbolos).
   - Persistencia: `KV_REST_API_URL` + `KV_REST_API_TOKEN`
     (o `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`).
2. Redeploy y verificar:
   - `GET /api/estado` → `{ almacen: "kv", auth: true }`.
   - Entrar al panel desde otro dispositivo/navegador: los datos se comparten.
3. Una vez confirmado, **borrar** el fallback `CLAVE_LOCAL` de `src/config.ts` y
   la lógica `local` de `src/pages/panel/useAdminSesion.ts` (o dejarla solo para
   dev local con `VITE_ADMIN_PASS_HASH`).
4. Correr `npm run typecheck && npm run test:api && npm run build`.

Criterio de aceptación: panel con cookie HttpOnly, sin clave en el bundle,
cambios visibles en cualquier dispositivo.

---

## 3) FASE 1 — LOGIN POR SUCURSAL + PERSONALIZACIÓN POR LOCAL (núcleo)

### 3.1 Auth con alcance (scope) por sucursal

Hoy `POST /api/sesion` valida una sola clave. Diseño:

- `scripts/clave.mjs` se extiende para generar un hash por sucursal:
  - Env `SUCURSAL_PASS_HASHES` = JSON `{ "<sucursalId>": "scrypt$…", … }`.
  - La clave del dueño (`ADMIN_PASS_HASH`) queda como **admin global**.
- `api/_lib/auth.ts`:
  - `POST /api/sesion` acepta `{ clave, sucursalId? }`.
  - El token pasa a llevar alcance: `expiracion.<sucursalId|''>`
    (vacío = admin global). `tokenValido` devuelve `{ valido, exp, sucursalId }`.
  - Nuevo guardián `exigirAcceso(p)` → devuelve `{ admin: true }` o
    `{ sucursalId }`, o un error 401/503.
- Aplicar el alcance en los handlers:
  - `stock.ts` PATCH: usuario de sucursal → solo su propia posición;
    admin global → cualquiera.
  - `productos.ts` PUT: global → todo; sucursal → solo sus arrays
    (`st`, `vis`, `px`), nunca borrar. DELETE: solo admin global.
  - `pedidos.ts` GET: sucursal → solo sus pedidos; global → todos.
    DELETE: solo admin global.
  - `sucursales.ts`, `catalogo.ts` PUT/POST: solo admin global.
- UI: `Login.tsx` suma selector de sucursal; el panel muestra el modo
  "Admin global" o "Sucursal: X" y oculta lo que no le corresponde
  (pestaña Sucursales y borrar productos solo para admin global).

### 3.2 Datos: visibilidad y precio/descuento por sucursal

Extender `Producto` en `src/types.ts` con dos arrays alineados a
`getSucursales()` (misma invariante que `st`):

- `vis: boolean[]` — visible (o no) en la tienda para esa sucursal.
  Defecto: todo `true`. (Cubre "quitar ciertos productos de mi local".)
- `px: (number | null)[]` — precio especial por sucursal; `null` = usa el
  precio global `p`. (Cubre "precios especiales / descuentos".)

Reglas:

- **Precio efectivo** para la sucursal = `px[idx] ?? p`. Un solo punto de
  cálculo (`src/lib/format.ts`/helper de precio) para que tienda y panel
  muestren lo mismo.
- **Catálogo visible** de una sucursal = productos con `vis[idx] !== false`.
- `src/lib/dominio.ts`: extender `alinearStock` y `sanearCatalogo` para
  alinear `vis`/`px` al crear/eliminar sucursales (mismo patrón que ya usa `st`).
- `api/_lib/datos.ts` siembra y sanea las mismas reglas del lado servidor.

Criterio de aceptación: un encargado entra con su sucursal, ve solo su stock y
puede editar precios/visibilidad de su local; no puede borrar productos ni ver
pedidos de otras sucursales. El admin global lo ve todo.

---

## 4) FASE 2 — IMPORTAR DESDE EXCEL/CSV

Objetivo: subir "la base que está en Excel" y que quede en la página.

- **Formato v1: CSV UTF-8** (exportable desde Excel sin dependencias nuevas).
  Columnas: `nombre, presentacion, laboratorio, activo, categoria, precio,
  stock_<sucursalId>` (una columna por sucursal). Si se quiere `.xlsx` real,
  añadir el paquete `xlsx` (SheetJS) y parsear en el cliente con la misma
  tabla de mapeo.
- **UI** en `ProductosAdmin` (admin global): botón "Importar" → subir archivo →
  vista previa con filas inválidas marcadas → confirmar → `PUT /api/catalogo`
  con el catálogo completo (el contrato ya existe y sanea).
- **Plantilla descargable** del CSV con el formato exacto y las categorías
  válidas (`CATEGORIAS_VALIDAS`).
- **v2 (opcional)**: importación por sucursal (solo `px`/`st` de ese local)
  reutilizando el mismo parser.

Criterio de aceptación: subir el Excel → el catálogo queda en el backend y se ve
en la tienda y en el panel de todas las sucursales tras recargar.

---

## 5) FASE 3 — PULIDO Y CUPO (puede ir en paralelo)

- Analítica con ventas reales: `analytics.ts`/`SalesTrend.tsx` consumen
  `GET /api/pedidos` (ya filtrable por sucursal desde Fase 1).
- Números WhatsApp reales de Santa María y Ñuñoa
  (`src/data/sucursales.ts:51,62`, hoy apuntan al de Independencia).
- SEO/OG pendiente: `og:image`, `twitter:card`, `canonical` ya hay scripts
  (`npm run og`, `npm run seo`) pero falta revisar el `index.html` resultante.
- **Ruta futura con luz verde**: migrar a **Supabase** (Postgres + Auth + RLS).
  El `api/_lib/almacen.ts` ya aísla la persistencia en una interfaz; migrar =
  implementar `Almacen` sobre Postgres y reemplazar `auth.ts` por Supabase Auth,
  sin tocar los handlers ni la SPA.

---

## 6) PRUEBAS A EXTENDER (obligatorio por fase)

En `pruebas/api.test.mjs` (hoy 25 pasan):

- Fase 1: login con clave de sucursal → token con `sucursalId`; usuario de
  sucursal no puede borrar producto ni ver pedidos ajenos; `PATCH /api/stock`
  con otra sucursal → 403; invariante de `vis`/`px` al crear/eliminar sucursal.
- Fase 2: `PUT /api/catalogo` con filas sucias (precios negativos, categoría
  inválida) → saneadas como en `dominio.ts`.

Comandos de verificación en cada fase:
`npm run typecheck && npm run test:api && npm run build`.

---

## GLOSARIO DE ARCHIVOS CLAVE

| Archivo | Rol |
|---|---|
| `api/_lib/auth.ts` | hashes scrypt, token firmado, cookie, límite de intentos |
| `api/_lib/almacen.ts` | interfaz `Almacen` (kv/archivo), puerta a Supabase |
| `api/_lib/datos.ts` | lectura/escritura catálogo + pedidos, siembra |
| `api/*.ts` | handlers serverless (`servir`, sin caché) |
| `src/lib/dominio.ts` | dominio puro compartido (saneado + invariantes) |
| `src/lib/api.ts` | cliente HTTP + detección de capacidades |
| `src/data/repo.ts` | external store `api|local`, escritura optimista |
| `src/pages/panel/useAdminSesion.ts` | sesión del panel (api/local) |
| `src/config.ts` | `CLAVE_LOCAL` (fallback a borrar), `CLAVES` |
| `pruebas/api.test.mjs` | suite de la API (node --test) |
| `scripts/clave.mjs` | genera hashes y secretos |
