import { loadEnv, type Connect, type Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/* ================================================================
   Monta las funciones de `api/` en el dev server de Vite.
   ----------------------------------------------------------------
   En producción las sirve Vercel; en desarrollo esto permite probar el
   flujo completo (login, CRUD, pedidos) con `npm run dev`, sin necesidad
   de `vercel dev`. La resolución de rutas imita la de Vercel:
   `/api/productos` → `api/productos.ts`.

   También carga `.env` en `process.env` para que las funciones locales
   vean ADMIN_PASS_HASH, KV_REST_API_URL, etc. (Vite por sí solo expone
   únicamente las variables `VITE_*` al navegador).
   ================================================================ */

type Manejador = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;

export function apiDev(): Plugin {
  return {
    name: 'farmacias-real-api-dev',

    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '');
      Object.entries(env).forEach(([clave, valor]) => {
        if (process.env[clave] === undefined) process.env[clave] = valor;
      });
    },

    configureServer(server) {
      const middleware: Connect.NextHandleFunction = (req, res, next) => {
        const url = req.url ?? '/';
        if (!url.startsWith('/api/')) return next();

        const ruta = url.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '');
        const archivo = resolve(process.cwd(), 'api', `${ruta}.ts`);

        if (ruta.startsWith('_') || !existsSync(archivo)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: `No existe /api/${ruta}` }));
          return;
        }

        server
          .ssrLoadModule(archivo)
          .then((mod) => (mod.default as Manejador)(req, res))
          .catch((e: unknown) => {
            server.config.logger.error(`[api-dev] ${ruta}: ${String(e)}`);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: 'Error en la función local' }));
          });
      };

      server.middlewares.use(middleware);
    },
  };
}
