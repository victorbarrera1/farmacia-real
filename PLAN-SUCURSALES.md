# ESTADO DEL PROYECTO — Panel por sucursal, importación Excel y seguridad

> Actualizado tras auditoría de código completa (agosto 2026). Este documento
> nació como plan de trabajo; hoy documenta lo que **ya está hecho y
> verificado en el código**, y lo poco que queda, que es sobre todo
> configuración y datos del cliente, no desarrollo. **No reconstruir nada de
> lo que aparece en la sección 0.**

---

## 0) YA IMPLEMENTADO Y PROBADO (no rehacer)

La app tiene una **API completa en `app/api/*/route.ts`** (Next.js Route
Handlers, adaptadores delgados) que delega en lógica pura en
`src/server/api/*` y `src/server/_lib/*`, conectada a la tienda y al panel:

- `src/server/_lib/auth.ts` — autenticación real en servidor: hash **scrypt**
  (`ADMIN_PASS_HASH` para admin global, `SUCURSAL_PASS_HASHES` por local — la
  clave nunca viaja al bundle), token **HMAC-SHA256** con alcance
  (`sucursalId` vacío = admin) en cookie **HttpOnly + SameSite=Lax (+Secure)**
  `fr_sesion`, límite de 10 intentos/15 min por IP. Se genera todo con
  `npm run clave`.
- `src/server/_lib/almacen.ts` — persistencia con 2 drivers: **Redis REST**
  (Vercel KV / Upstash, producción) o **JSON en `.data/`** (dev/test). Sin
  configurar → API en modo lectura (sirve datos de fábrica).
- **Login por sucursal**: implementado end-to-end (auth, API, UI). Un
  encargado entra con la clave de su local, ve y edita solo su stock, precio
  y visibilidad, y no puede borrar productos ni ver pedidos de otros locales.
  El admin global lo ve y edita todo.
- **Precio y visibilidad por sucursal**: cada producto tiene `st[]`
  (unidades), `vis[]` (visible o no en la tienda de ese local) y `px[]`
  (precio propio; `null` = usa el precio de lista `p`), alineados por
  posición con `sucursales[]`. El invariante se mantiene en un solo lugar
  (`src/lib/dominio.ts`), compartido entre navegador y servidor.
- **Importación/exportación CSV**: `src/lib/csv.ts` + UI en
  `src/views/panel/CatalogoIO.tsx` — exportar, plantilla descargable,
  importar con vista previa de errores/avisos antes de reemplazar, y
  respaldo/restauración en JSON.
- Endpoints: `sesion` (login/logout/check con alcance), `catalogo` (GET
  público; PUT admin = reemplazo completo, para importar; POST restaurar),
  `productos` (GET/PUT/DELETE, con `fusionarLocal` para que un encargado solo
  toque su posición), `sucursales` (GET/PUT/DELETE con invariante de `st[]`
  reindexado), `stock` (PATCH fija o suma/resta por `sucursalId`), `pedidos`
  (POST público, GET/DELETE admin o local), `estado` (capacidades del
  backend, sin secretos).
- La tienda y el panel ya están cableados: login contra `POST /api/sesion`,
  catálogo contra `/api/catalogo`, CRUD de productos/sucursales/stock contra
  la API, pedidos contra `/api/pedidos`. Sin variables de entorno, todo cae a
  modo local (localStorage) y el sitio sigue funcionando.
- **Pruebas**: `npm run test:api` → 44 pruebas (auth, alcance por sucursal,
  CRUD, invariante de `st/vis/px`, pedidos, saneamiento de importación CSV,
  límite de intentos). Typecheck y build pasan.
- Pestañas del panel: Resumen, Productos, Precios y visibilidad, Stock,
  Sucursales, Pedidos, Análisis (con `SalesTrend` cableada a
  `GET /api/pedidos`, todavía sin datos reales que mostrar).

### Correcciones aplicadas en esta pasada

- `src/lib/csv.ts` (`escapar`): se neutraliza la inyección de fórmulas de
  Excel/Sheets — cualquier valor de texto libre que empiece con `=`, `+`,
  `-` o `@` se antepone con `'` antes de exportarlo a CSV.
- `src/lib/whatsapp.ts` + `src/config.ts`: el "Total referencial" del mensaje
  de WhatsApp ahora **excluye por defecto** el valor de los productos con
  receta (`INCLUIR_RECETA_EN_TOTAL_WHATSAPP = false`), para que el mensaje
  nunca revele su precio ni siquiera agregado dentro del total — esto es
  consistente con lo que el propio README ya declaraba ("sin precio en el
  mensaje de WhatsApp" para receta), que antes no se cumplía del todo en el
  total. **Sigue pendiente de confirmación con el dueño/asesor legal** si
  esta es la regla definitiva (ver sección 1 abajo).
- `package.json`: se quitaron `gsap` y `@gsap/react` — no se usaban en
  ningún import real (`src/`/`app/`), coherente con la política "sin
  animaciones" ya documentada en `MASTER.md`.
- `lucide-react@^1.27.0` se revisó: es una versión real y vigente de la
  librería (llegó a la serie 1.x; la última publicada es 1.33.0) y está en
  uso extensivo (28 archivos). No se tocó — no era código muerto.

### Lo que falta de verdad (configuración y datos, no desarrollo)

1. **Activar el backend en producción**: definir las variables de entorno en
   Vercel (sección 2, Fase 0 — sigue vigente, es lo único que no se ha hecho).
2. Números de WhatsApp reales de Santa María 1789 y Simón Bolívar 3751
   (`src/data/sucursales.ts` — hoy apuntan al de Independencia 1443).
3. Catálogo real vía CSV (hoy son 38 productos demo, incluidos 8 de
   Perfumería).
4. Clave del panel definitiva (la provisional está marcada como débil).
5. Emblema del logo real (hoy es una aproximación SVG en `SvgSprite.tsx`).
6. Dominio definitivo (`SITIO_URL` en `src/config.ts` apunta hoy a
   `https://farmaciareal.vercel.app`) + correr `npm run seo`.
7. Confirmar la regla de `INCLUIR_RECETA_EN_TOTAL_WHATSAPP` con el
   dueño/asesor legal antes de publicar.
8. Analítica alimentada con reservas reales (ya está cableada, se llena sola
   en cuanto entren pedidos por `POST /api/pedidos`).

---

## 1) SEGURIDAD DEL PANEL (pregunta respondida)

El panel **puede quedarse en `/panel`** sin problema **si la autenticación es
de servidor**, que ya lo es. Reglas que se mantienen:

- La clave nunca se compara en el navegador en producción. El fallback
  PBKDF2 (`src/config.ts` → `CLAVE_LOCAL`, variables
  `NEXT_PUBLIC_ADMIN_PASS_HASH`/`_SALT`) es solo para que el panel no quede
  inaccesible sin backend durante desarrollo; **verificar que esas variables
  NEXT_PUBLIC_\* no queden definidas en el entorno de producción** (si
  quedan, cualquiera podría intentar fuerza bruta contra el hash desde el
  navegador, sin el límite de intentos que sí tiene el servidor).
- No depender de ruta oculta: `/panel` por nombre no es seguridad, la cookie
  HttpOnly + el chequeo server-side sí lo son.
- La cookie `fr_sesion` no la lee JavaScript (anti-XSS). El límite de
  intentos frena fuerza bruta. Todo esto ya está implementado y testeado.
- Opciones adicionales (opcionales, no bloqueantes): cabecera CSP estricta en
  Vercel, y en el futuro migrar a **Postgres/Supabase** cuando haya luz verde
  (ver §5). Para el volumen actual (4 locales) no hace falta.

---

## 2) FASE 0 — ACTIVAR LO QUE YA EXISTE (30 min) — ÚNICO PASO TÉCNICO PENDIENTE

1. En el proyecto Vercel → Settings → Environment Variables:
   - `ADMIN_PASS_HASH` y `ADMIN_SESSION_SECRET` generados con `npm run clave`.
     Usar una clave real (≥ 10 caracteres, con números y símbolos).
   - `SUCURSAL_PASS_HASHES` (JSON) generado con `npm run clave -- --sucursales`
     para las claves de cada encargado.
   - Persistencia: `KV_REST_API_URL` + `KV_REST_API_TOKEN`
     (o `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`).
2. Redeploy y verificar:
   - `GET /api/estado` → `{ almacen: "kv", auth: true }`.
   - Entrar al panel desde otro dispositivo/navegador: los datos se comparten.
   - Confirmar que `NEXT_PUBLIC_ADMIN_PASS_HASH`/`_SALT` **no** estén
     definidas en las variables de entorno de producción.
3. Correr `npm run typecheck && npm run test:api && npm run build`.

Criterio de aceptación: panel con cookie HttpOnly, sin clave en el bundle,
cambios visibles en cualquier dispositivo, cada encargado entra solo con la
clave de su sucursal.

---

## 3) FASE 1 — LOGIN POR SUCURSAL + PERSONALIZACIÓN POR LOCAL — ✅ HECHO

Todo lo que describía esta fase (auth con alcance por sucursal, `vis[]`/`px[]`
por local, permisos diferenciados en cada handler, UI del panel con selector
de sucursal) ya está implementado y cubierto por pruebas. Ver sección 0.

---

## 4) FASE 2 — IMPORTAR DESDE EXCEL/CSV — ✅ HECHO

Formato CSV UTF-8 con `;` como separador, plantilla descargable, vista previa
de errores/avisos, y `PUT /api/catalogo` para el reemplazo completo, todo
implementado en `src/lib/csv.ts` + `src/views/panel/CatalogoIO.tsx`. Ver
sección 0.

**Pendiente real, no de código:** que el dueño entregue el catálogo real para
cargarlo (hoy son datos de demostración).

---

## 5) FASE 3 — PULIDO (lo que queda)

- Analítica con reservas reales: `analytics.ts`/`SalesTrend.tsx` ya consumen
  `GET /api/pedidos` filtrable por sucursal; solo falta que existan reservas
  reales.
- Números WhatsApp reales de Santa María y Simón Bolívar
  (`src/data/sucursales.ts`, hoy apuntan al de Independencia).
- SEO/OG: scripts ya existen (`npm run og`, `npm run seo`); falta fijar el
  dominio definitivo y volver a correrlos.
- **Ruta futura, no bloqueante**: migrar a **Postgres/Neon o Supabase** si
  crece el número de sucursales o se necesita historial/auditoría relacional.
  `src/server/_lib/almacen.ts` ya aísla la persistencia en una interfaz;
  migrar = implementar `Almacen` sobre Postgres, sin tocar los handlers ni la
  UI.

---

## 6) PRUEBAS

`pruebas/api.test.mjs` + `pruebas/perfumeria.test.mjs` → 44 pruebas hoy
(auth, alcance por sucursal, CRUD, invariante de `st/vis/px`, pedidos,
saneamiento de importación CSV, límites). Si se toca la regla de
`INCLUIR_RECETA_EN_TOTAL_WHATSAPP` o el escape de CSV, agregar un caso que
cubra el nuevo comportamiento.

Comando de verificación después de cualquier cambio:
`npm run typecheck && npm run test:api && npm run build`.

---

## GLOSARIO DE ARCHIVOS CLAVE

| Archivo | Rol |
|---|---|
| `app/api/*/route.ts` | adaptador delgado Next.js → `src/server/api/*` |
| `src/server/_lib/auth.ts` | hashes scrypt, token firmado con alcance, cookie, límite de intentos |
| `src/server/_lib/almacen.ts` | interfaz `Almacen` (kv/archivo), puerta a Postgres/Supabase |
| `src/server/_lib/datos.ts` | lectura/escritura catálogo + pedidos, siembra |
| `src/server/api/*.ts` | handlers puros (sin Next), los usa también `pruebas/api.test.mjs` |
| `src/lib/dominio.ts` | dominio puro compartido (saneado + invariantes `st/vis/px`) |
| `src/lib/csv.ts` | export/import CSV, plantilla, respaldo JSON |
| `src/lib/whatsapp.ts` | mensajes de WhatsApp (neutralidad de productos con receta) |
| `src/lib/api.ts` | cliente HTTP + detección de capacidades |
| `src/data/repo.ts` | external store `api\|local`, escritura optimista |
| `src/views/panel/useAdminSesion.ts` | sesión del panel (api/local) |
| `src/config.ts` | `CLAVE_LOCAL` (fallback dev), `INCLUIR_RECETA_EN_TOTAL_WHATSAPP`, `CLAVES` |
| `pruebas/*.test.mjs` | suite de la API y de Perfumería (node --test) |
| `scripts/clave.mjs` | genera hashes y secretos |
