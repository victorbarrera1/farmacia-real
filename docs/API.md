# API de Farmacias Real

Backend mínimo en **Next.js Route Handlers** (`app/api/*/route.ts`), delgados
adaptadores que delegan en la lógica pura de `src/server/api/*` y
`src/server/_lib/*` — mismo proyecto que la tienda, sin frameworks ni SDKs
extra: solo `fetch` y `node:crypto`.

- **Base:** `https://<dominio>/api`
- **Formato:** JSON en ambos sentidos. Toda respuesta trae `ok: true|false`.
- **Errores:** `{ "ok": false, "error": "texto legible" }` con el código HTTP
  correspondiente. Si falta configurar el backend: `503` + `"configurar": true`.
- **Caché:** todas las respuestas son `Cache-Control: no-store`.

## Por qué esta arquitectura

| Alternativa | Por qué no / por qué sí |
|---|---|
| **Vercel Functions + Redis REST (Vercel KV / Upstash)** ✅ | Ya estamos en Vercel: cero infraestructura nueva, cookies same-origin (sin CORS), plan gratis de sobra para 4 locales. El modelo de datos son dos documentos JSON (catálogo y sucursales) + una lista de reservas: encaja exacto con un KV, sin migraciones ni ORM. |
| Supabase | Da Postgres + Auth + panel, pero suma un proveedor y usaríamos el 5%; los proyectos gratis se pausan por inactividad, mal para un sitio de bajo tráfico. Vale la pena solo si más adelante se necesitan varios usuarios con roles o reportería relacional. |
| Postgres/Neon | Es el camino de crecimiento natural (historial de stock, auditoría). Migrar = reimplementar `api/_lib/almacen.ts`; los handlers y el cliente no cambian. |

**Degradación elegante:** si no hay variables de entorno, la API responde
`503`/`sin-configurar` y el sitio sigue funcionando en modo local
(localStorage), igual que antes de que existiera el backend.

## Variables de entorno

| Variable | Para qué | Cómo obtenerla |
|---|---|---|
| `KV_REST_API_URL` | Redis REST | Vercel → Storage → crear KV/Upstash (las inyecta solas) |
| `KV_REST_API_TOKEN` | Redis REST | idem |
| `ADMIN_PASS_HASH` | hash scrypt del admin general | `npm run clave -- "Clave"` |
| `ADMIN_SESSION_SECRET` | firma HMAC de la cookie de sesión | `npm run clave` |
| `SUCURSAL_PASS_HASHES` | JSON `{ "<sucursalId>": "scrypt:…" }` con la clave de cada local | `npm run clave -- --sucursales` |
| `ALMACEN=archivo` | (opcional, local) fuerza el driver de archivos en `.data/` | — |

También se aceptan `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

## Autenticación

Dos roles: **admin general** (`ADMIN_PASS_HASH`) y **encargado de sucursal**
(una clave por local en `SUCURSAL_PASS_HASHES`). El token lleva el alcance
(`sucursalId` vacío = admin global) y cada handler lo vuelve a validar en el
servidor (`exigirAcceso` / `exigirAdmin` en `src/server/_lib/auth.ts`).

1. `POST /api/sesion` con la clave (y `sucursalId` opcional) → el servidor la
   compara contra el hash **scrypt** correspondiente con `timingSafeEqual`.
2. Devuelve una cookie `fr_sesion=<vencimiento>.<HMAC-SHA256>`, con
   `HttpOnly; SameSite=Lax; Path=/; Max-Age=43200` (+ `Secure` en https).
   JavaScript de la página no puede leerla.
3. Los endpoints de escritura exigen esa cookie; sin ella responden `401`.
4. Límite de fuerza bruta: 10 intentos por IP cada 15 minutos → `429`.

---

## Endpoints

### `GET /api/estado`
Capacidades del backend. Lo usa el cliente para decidir si trabaja contra la
API o en modo local. No revela secretos.

```json
{ "ok": true, "api": true, "version": 2,
  "almacen": "kv" | "archivo" | "sin-configurar",
  "auth": true, "sesion": false, "admin": false, "sucursalId": "",
  "sucursalesConClave": ["sevilla"] }
```

### `GET /api/sesion` · `POST /api/sesion` · `DELETE /api/sesion`

```http
POST /api/sesion
{ "clave": "…", "sucursalId": "sevilla" }   // sucursalId opcional
→ 200 { "ok": true, "autorizado": true, "exp": 1767312000000,
        "admin": false, "sucursalId": "sevilla" }  + Set-Cookie
→ 401 { "ok": false, "error": "Clave incorrecta" }
→ 429 { "ok": false, "error": "Demasiados intentos…" }
→ 503 { "ok": false, "error": "Autenticación no configurada…", "configurar": true }
```

`GET` → `{ ok, autorizado, exp, admin, sucursalId }` · `DELETE` → borra la cookie.

### `GET /api/catalogo` — público
Lo que lee la tienda en una sola llamada.

```json
{ "ok": true, "productos": [Producto], "sucursales": [Sucursal],
  "version": 1767300000000, "almacen": "kv", "persistente": true }
```

### `PUT /api/catalogo` — admin
Reemplaza todo (import CSV, restaurar respaldo). Cuerpo:
`{ "productos": [Producto], "sucursales": [Sucursal] }` → `400` si falta alguna
lista o si quedaría sin sucursales.

### `POST /api/catalogo?accion=…` — admin
`restaurar` | `restaurarProductos` | `restaurarSucursales` → vuelve a los datos
de fábrica de `src/data/`.

### `GET /api/productos` — público · `PUT` — admin o local · `DELETE` — solo admin

```http
PUT /api/productos
{ "id": "p0", "n": "Paracetamol 500 mg", "pres": "20 comprimidos",
  "lab": "Laboratorio Chile", "act": "Paracetamol", "cat": "medicamentos",
  "il": "caja", "p": 1290, "be": true,
  "st":  [38, 24, 31, 19],          // unidades por sucursal
  "vis": [true, false, true, true], // visible en la tienda de esa sucursal
  "px":  [null, 990, null, null] }  // precio propio; null = usa `p`
→ 200 { "ok": true, "productos": [...], "version": … }
```

Un **encargado de local** puede llamar este `PUT`, pero el servidor solo toma
`st`, `vis` y `px` **de su posición** (ver `fusionarLocal` en `dominio.ts`):
nombre, precio de lista y categoría se ignoran, y si el producto no existe
responde `404` (no puede crear). `DELETE` es solo del admin general (`403`).

### `GET /api/sucursales` — público · `PUT` / `DELETE` — admin

`PUT` sin `id` lo deriva del nombre (slug único). Exige WhatsApp chileno
válido (`56` + 9 dígitos) porque de ahí sale el destino de las reservas.
Al crear o eliminar, **reindexa el stock de todos los productos**.

```http
DELETE /api/sucursales?id=nunoa
→ 200 { "ok": true, "sucursales": [...], "productos": [...] }
→ 409 si es la última sucursal
```

### `PATCH /api/stock` — admin o local

```json
{ "id": "p0", "sucursalId": "nunoa", "unidades": 42 }
{ "id": "p0", "sucursalId": "nunoa", "delta": -1 }
```
→ `{ ok, producto, version }`. También acepta `idx` (índice posicional).
Un encargado solo puede tocar su propia sucursal: otra → `403`.

### `/api/pedidos`

| Método | Acceso | Qué hace |
|---|---|---|
| `POST` | **público** | La tienda registra la reserva enviada por WhatsApp. `201 { ok, pedido }`. Idempotente por `id`. |
| `GET` | admin / local | `{ ok, pedidos: [...], alcance }`. El local solo ve los de su sucursal |
| `DELETE ?id=…` / `?todos=1` | solo admin | Borra uno o todo el historial (`403` para un local) |

```json
{ "id": "o-abc123", "fecha": "2026-08-05T22:10:00.000Z",
  "sucursalId": "independencia", "sucursalNombre": "Independencia 1443",
  "items": [{ "id": "p0", "n": "Paracetamol 500 mg", "pres": "20 comprimidos",
              "lab": "Laboratorio Chile", "p": 1290, "c": 2 }] }
```

No lleva datos personales: son productos, cantidades, total y sucursal. `total`
y `unidades` se recalculan en el servidor si no cuadran.

---

## Reglas de negocio que hace cumplir el servidor

1. **`st`, `vis` y `px` alineados por posición con `sucursales`.** Alta → nueva
   posición (`0` unidades, visible, sin precio propio); baja → se quita esa
   posición conservando el resto por id.
2. **Nunca cero sucursales** (`409`): la tienda no funcionaría.
3. **Saneamiento de toda la entrada** (`src/lib/dominio.ts`, el mismo módulo
   que usa el navegador): ids a slug, textos con tope de largo, enteros no
   negativos, categorías e ilustraciones restringidas a las válidas, WhatsApp
   solo dígitos.
4. **Tope de cuerpo** 1 MB (`413`) y de historial 500 reservas.

## Cómo se prueba

```bash
npm run test:api      # 44 pruebas: auth, alcance por sucursal, CRUD, invariantes
                      # de st/vis/px, pedidos, saneamiento de importación, límites
npm run dev           # next dev — tienda, panel y app/api/* juntos
curl -s localhost:3000/api/estado | jq
```

## Pendientes conocidos

- Las claves de sucursal viven en una variable de entorno (JSON). Para más
  usuarios por local, o rotación individual sin redeploy, toca pasar a una
  tabla de usuarios (Postgres/Neon o Supabase Auth + RLS): la interfaz
  `Almacen` ya aísla la persistencia.
- El historial de reservas no distingue visitantes; es un registro de
  cotizaciones, no un CRM.
