/* ================================================================
   Pruebas de la API (node --test).
   ----------------------------------------------------------------
   Levantan las mismas funciones de `api/` en un servidor http local,
   con el driver de archivos, y ejercen el contrato completo: auth,
   CRUD, invariante de st[], pedidos y saneamiento de entrada.

   Ejecutar:  npm run test:api
   ================================================================ */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scryptSync, randomBytes } from 'node:crypto';

const CLAVE = 'clave-de-prueba-2026';
const CLAVE_SEVILLA = 'clave-sevilla-2026';
const N = 16384, r = 8, p = 1;
const sal = randomBytes(16);
const hash = scryptSync(CLAVE, sal, 32, { N, r, p });
const salSuc = randomBytes(16);
const hashSuc = scryptSync(CLAVE_SEVILLA, salSuc, 32, { N, r, p });

let dir;
let servidor;
let base;
let cookie = '';

/** Rutas → handler, igual que la resolución de archivos de Vercel. */
const RUTAS = ['estado', 'sesion', 'catalogo', 'productos', 'sucursales', 'stock', 'pedidos'];

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'fr-api-'));
  process.env.ALMACEN = 'archivo';
  process.env.ALMACEN_DIR = dir;
  process.env.ADMIN_PASS_HASH = `scrypt:${N}:${r}:${p}:${sal.toString('hex')}:${hash.toString('hex')}`;
  process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString('hex');
  process.env.SUCURSAL_PASS_HASHES = JSON.stringify({
    sevilla: `scrypt:${N}:${r}:${p}:${salSuc.toString('hex')}:${hashSuc.toString('hex')}`,
  });
  delete process.env.VERCEL;

  const handlers = {};
  for (const ruta of RUTAS) {
    handlers[ruta] = (await import(new URL(`../api/${ruta}.ts`, import.meta.url))).default;
  }

  servidor = createServer((req, res) => {
    const ruta = (req.url ?? '').split('?')[0].replace(/^\/api\//, '');
    const h = handlers[ruta];
    if (!h) {
      res.statusCode = 404;
      res.end('{"ok":false}');
      return;
    }
    h(req, res);
  });
  await new Promise((listo) => servidor.listen(0, listo));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor?.close();
  await rm(dir, { recursive: true, force: true });
});

async function llamar(ruta, { metodo = 'GET', cuerpo, conCookie = true, cookieExplicita } = {}) {
  const galleta = cookieExplicita ?? (conCookie ? cookie : '');
  const res = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: {
      ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(galleta ? { Cookie: galleta } : {}),
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const datos = await res.json();
  return { estado: res.status, datos, cabeceras: res.headers };
}

/* ------------------------------ estado ------------------------- */

describe('GET /api/estado', () => {
  it('informa el almacén y que la auth está configurada, sin filtrar secretos', async () => {
    const { estado, datos } = await llamar('/api/estado');
    assert.equal(estado, 200);
    assert.equal(datos.almacen, 'archivo');
    assert.equal(datos.auth, true);
    assert.equal(datos.sesion, false);
    assert.equal(JSON.stringify(datos).includes(CLAVE), false);
  });
});

/* ----------------------------- catálogo ------------------------ */

describe('GET /api/catalogo (público)', () => {
  it('sirve el catálogo de fábrica con st[] alineado a las sucursales', async () => {
    const { estado, datos } = await llamar('/api/catalogo');
    assert.equal(estado, 200);
    assert.equal(datos.sucursales.length, 4);
    assert.equal(datos.productos.length, 30);
    for (const prod of datos.productos) assert.equal(prod.st.length, 4);
    assert.equal(datos.persistente, true);
  });
});

/* ------------------------------- auth -------------------------- */

describe('autenticación', () => {
  it('rechaza escrituras sin sesión', async () => {
    const { estado } = await llamar('/api/productos', { metodo: 'PUT', cuerpo: { id: 'x', n: 'X' } });
    assert.equal(estado, 401);
  });

  it('rechaza la clave incorrecta', async () => {
    const { estado, datos } = await llamar('/api/sesion', {
      metodo: 'POST',
      cuerpo: { clave: 'no-es-la-clave' },
    });
    assert.equal(estado, 401);
    assert.equal(datos.ok, false);
  });

  it('acepta la clave correcta y entrega una cookie HttpOnly', async () => {
    const { estado, datos, cabeceras } = await llamar('/api/sesion', {
      metodo: 'POST',
      cuerpo: { clave: CLAVE },
    });
    assert.equal(estado, 200);
    assert.equal(datos.autorizado, true);
    const set = cabeceras.get('set-cookie');
    assert.match(set, /^fr_sesion=/);
    assert.match(set, /HttpOnly/);
    assert.match(set, /SameSite=Lax/);
    /* En http local no debe marcar Secure (si no, el navegador la descarta). */
    assert.equal(/Secure/.test(set), false);
    cookie = set.split(';')[0];
  });

  it('reconoce la sesión en GET /api/sesion', async () => {
    const { datos } = await llamar('/api/sesion');
    assert.equal(datos.autorizado, true);
    assert.ok(datos.exp > Date.now());
  });

  it('no acepta una cookie con firma alterada', async () => {
    const res = await fetch(`${base}/api/sesion`, { headers: { Cookie: `${cookie}xx` } });
    const datos = await res.json();
    assert.equal(datos.autorizado, false);
  });
});

/* ---------------------------- productos ------------------------ */

describe('CRUD de productos', () => {
  it('crea un producto y sanea la entrada sucia', async () => {
    const { estado, datos } = await llamar('/api/productos', {
      metodo: 'PUT',
      cuerpo: {
        id: 'QA-Prueba_01!',           // se sanea a slug
        n: '  Producto QA  ',
        pres: '10 comprimidos',
        lab: 'Lab QA',
        act: 'Activo',
        cat: 'categoria-inventada',    // cae a 'medicamentos'
        il: 'ovni',                    // cae a 'caja'
        p: -999,                       // cae a 0
        st: ['7', 2.9, null, 4],       // enteros no negativos
        be: 'sí',                      // solo true cuenta
      },
    });
    assert.equal(estado, 200);
    const creado = datos.productos.find((x) => x.n === 'Producto QA');
    assert.ok(creado, 'el producto debería existir');
    assert.equal(creado.id, 'qa-prueba-01');
    assert.equal(creado.cat, 'medicamentos');
    assert.equal(creado.il, 'caja');
    assert.equal(creado.p, 0);
    assert.deepEqual(creado.st, [7, 2, 0, 4]);
    assert.equal(creado.be, undefined);
  });

  it('actualiza el stock por sucursalId', async () => {
    const { estado, datos } = await llamar('/api/stock', {
      metodo: 'PATCH',
      cuerpo: { id: 'qa-prueba-01', sucursalId: 'nunoa', unidades: 42 },
    });
    assert.equal(estado, 200);
    assert.equal(datos.producto.st[3], 42);
  });

  it('suma y resta con delta, sin bajar de cero', async () => {
    await llamar('/api/stock', { metodo: 'PATCH', cuerpo: { id: 'qa-prueba-01', sucursalId: 'nunoa', delta: -100 } });
    const { datos } = await llamar('/api/catalogo');
    assert.equal(datos.productos.find((x) => x.id === 'qa-prueba-01').st[3], 0);
  });

  it('rechaza el stock de una sucursal inexistente', async () => {
    const { estado } = await llamar('/api/stock', {
      metodo: 'PATCH',
      cuerpo: { id: 'qa-prueba-01', sucursalId: 'no-existe', unidades: 1 },
    });
    assert.equal(estado, 400);
  });

  it('elimina el producto', async () => {
    const { estado, datos } = await llamar('/api/productos?id=qa-prueba-01', { metodo: 'DELETE' });
    assert.equal(estado, 200);
    assert.equal(datos.productos.some((x) => x.id === 'qa-prueba-01'), false);
  });
});

/* ---------------------------- sucursales ----------------------- */

describe('CRUD de sucursales e invariante de st[]', () => {
  it('exige un WhatsApp con formato chileno válido', async () => {
    const { estado, datos } = await llamar('/api/sucursales', {
      metodo: 'PUT',
      cuerpo: { nombre: 'Sucursal QA', direccion: 'Calle QA 1', whatsapp: '123' },
    });
    assert.equal(estado, 400);
    assert.match(datos.error, /WhatsApp/);
  });

  it('al crear una sucursal, todos los productos suman una posición en 0', async () => {
    const { estado, datos } = await llamar('/api/sucursales', {
      metodo: 'PUT',
      cuerpo: {
        nombre: 'Sucursal QA', corto: 'QA', comuna: 'Recoleta',
        direccion: 'Calle QA 1', telefono: '+56 9 0000 0000', whatsapp: '56900000000',
        horario: [{ d: [1, 2, 3, 4, 5], et: 'Lunes a viernes', abre: '09:00', cierra: '20:00' }],
      },
    });
    assert.equal(estado, 200);
    assert.equal(datos.sucursales.length, 5);
    assert.equal(datos.sucursales[4].id, 'sucursal-qa');
    for (const prod of datos.productos) {
      assert.equal(prod.st.length, 5);
      assert.equal(prod.st[4], 0);
    }
  });

  it('conserva el stock por id al eliminar una sucursal del medio', async () => {
    const antes = (await llamar('/api/catalogo')).datos;
    const paracetamol = antes.productos.find((x) => x.n.startsWith('Paracetamol'));
    const stNunoaAntes = paracetamol.st[3];

    const { estado, datos } = await llamar('/api/sucursales?id=sevilla', { metodo: 'DELETE' });
    assert.equal(estado, 200);
    assert.equal(datos.sucursales.length, 4);
    assert.equal(datos.sucursales.some((s) => s.id === 'sevilla'), false);

    const despues = datos.productos.find((x) => x.n.startsWith('Paracetamol'));
    assert.equal(despues.st.length, 4);
    /* Ñuñoa pasó de la posición 3 a la 2 y mantuvo sus unidades. */
    assert.equal(despues.st[2], stNunoaAntes);
  });

  it('no permite quedarse sin sucursales', async () => {
    for (const id of ['santamaria', 'nunoa', 'sucursal-qa']) {
      await llamar(`/api/sucursales?id=${id}`, { metodo: 'DELETE' });
    }
    const { estado, datos } = await llamar('/api/sucursales?id=independencia', { metodo: 'DELETE' });
    assert.equal(estado, 409);
    assert.equal((await llamar('/api/catalogo')).datos.sucursales.length, 1);
    assert.match(datos.error, /única/);
  });

  it('restaura los datos de fábrica', async () => {
    const { estado, datos } = await llamar('/api/catalogo?accion=restaurar', { metodo: 'POST' });
    assert.equal(estado, 200);
    assert.equal(datos.sucursales.length, 4);
    assert.equal(datos.productos.length, 30);
    for (const prod of datos.productos) assert.equal(prod.st.length, 4);
  });
});

/* ------------------------------ pedidos ------------------------ */

describe('pedidos', () => {
  it('acepta una reserva de la tienda sin sesión (endpoint público)', async () => {
    const { estado, datos } = await llamar('/api/pedidos', {
      metodo: 'POST',
      conCookie: false,
      cuerpo: {
        id: 'o-prueba-1',
        fecha: new Date().toISOString(),
        sucursalId: 'independencia',
        sucursalNombre: 'Independencia 1443',
        items: [{ id: 'p0', n: 'Paracetamol 500 mg', pres: '20 comprimidos', lab: 'Lab', p: 1290, c: 2 }],
      },
    });
    assert.equal(estado, 201);
    assert.equal(datos.pedido.total, 2580);
    assert.equal(datos.pedido.unidades, 2);
  });

  it('no duplica un pedido reenviado con el mismo id', async () => {
    await llamar('/api/pedidos', {
      metodo: 'POST',
      conCookie: false,
      cuerpo: {
        id: 'o-prueba-1',
        items: [{ n: 'Paracetamol 500 mg', p: 1290, c: 2 }],
      },
    });
    const { datos } = await llamar('/api/pedidos');
    assert.equal(datos.pedidos.filter((o) => o.id === 'o-prueba-1').length, 1);
  });

  it('rechaza un pedido vacío', async () => {
    const { estado } = await llamar('/api/pedidos', { metodo: 'POST', conCookie: false, cuerpo: { items: [] } });
    assert.equal(estado, 400);
  });

  it('solo el admin puede leer el historial', async () => {
    const { estado } = await llamar('/api/pedidos', { conCookie: false });
    assert.equal(estado, 401);
    const conSesion = await llamar('/api/pedidos');
    assert.equal(conSesion.estado, 200);
    assert.equal(conSesion.datos.pedidos.length, 1);
  });

  it('borra el historial completo', async () => {
    const { datos } = await llamar('/api/pedidos?todos=1', { metodo: 'DELETE' });
    assert.deepEqual(datos.pedidos, []);
  });
});

/* ---------------------------- logout + límite ------------------ */

describe('cierre de sesión y límite de intentos', () => {
  it('DELETE /api/sesion invalida la cookie en el navegador', async () => {
    const { estado, cabeceras } = await llamar('/api/sesion', { metodo: 'DELETE' });
    assert.equal(estado, 200);
    assert.match(cabeceras.get('set-cookie'), /Max-Age=0/);
  });

  it('bloquea la fuerza bruta tras 10 intentos por IP', async () => {
    let ultimo = 0;
    for (let i = 0; i < 12; i++) {
      ultimo = (await llamar('/api/sesion', { metodo: 'POST', cuerpo: { clave: `mala-${i}` }, conCookie: false })).estado;
    }
    assert.equal(ultimo, 429);
  });

  it('responde 405 con Allow en métodos no soportados', async () => {
    const { estado, cabeceras } = await llamar('/api/estado', { metodo: 'POST', cuerpo: {} });
    assert.equal(estado, 405);
    assert.equal(cabeceras.get('allow'), 'GET');
  });
});

/* --------------------- alcance por sucursal -------------------- */

describe('login por sucursal y alcance de permisos', () => {
  let cookieSuc = '';

  /* El caso de fuerza bruta deja la IP con el cupo agotado: lo reiniciamos. */
  before(async () => {
    for (const archivo of await readdir(dir)) {
      if (archivo.startsWith('intentos')) await rm(join(dir, archivo), { force: true });
    }
  });

  it('el encargado entra con la clave de su local y el token lleva el alcance', async () => {
    const { estado, datos, cabeceras } = await llamar('/api/sesion', {
      metodo: 'POST',
      conCookie: false,
      cuerpo: { clave: CLAVE_SEVILLA, sucursalId: 'sevilla' },
    });
    assert.equal(estado, 200);
    assert.equal(datos.admin, false);
    assert.equal(datos.sucursalId, 'sevilla');
    cookieSuc = cabeceras.get('set-cookie').split(';')[0];

    const sesion = await llamar('/api/sesion', { cookieExplicita: cookieSuc });
    assert.equal(sesion.datos.autorizado, true);
    assert.equal(sesion.datos.admin, false);
    assert.equal(sesion.datos.sucursalId, 'sevilla');
  });

  it('la clave de una sucursal no sirve para otra', async () => {
    const { estado } = await llamar('/api/sesion', {
      metodo: 'POST',
      conCookie: false,
      cuerpo: { clave: CLAVE_SEVILLA, sucursalId: 'nunoa' },
    });
    assert.equal(estado, 401);
  });

  it('/api/estado informa el alcance sin filtrar hashes', async () => {
    const { datos } = await llamar('/api/estado', { cookieExplicita: cookieSuc });
    assert.equal(datos.admin, false);
    assert.equal(datos.sucursalId, 'sevilla');
    assert.deepEqual(datos.sucursalesConClave, ['sevilla']);
    assert.equal(JSON.stringify(datos).includes('scrypt'), false);
  });

  it('puede ajustar el stock de su sucursal', async () => {
    const { estado, datos } = await llamar('/api/stock', {
      metodo: 'PATCH',
      cookieExplicita: cookieSuc,
      cuerpo: { id: 'p0', sucursalId: 'sevilla', unidades: 17 },
    });
    assert.equal(estado, 200);
    assert.equal(datos.producto.st[1], 17);
  });

  it('no puede tocar el stock de otra sucursal (403)', async () => {
    const { estado, datos } = await llamar('/api/stock', {
      metodo: 'PATCH',
      cookieExplicita: cookieSuc,
      cuerpo: { id: 'p0', sucursalId: 'nunoa', unidades: 999 },
    });
    assert.equal(estado, 403);
    assert.match(datos.error, /tu sucursal/i);
  });

  it('al editar un producto solo cambia st/vis/px de su posición', async () => {
    const antes = (await llamar('/api/catalogo')).datos.productos.find((x) => x.id === 'p0');
    const { estado, datos } = await llamar('/api/productos', {
      metodo: 'PUT',
      cookieExplicita: cookieSuc,
      cuerpo: {
        id: 'p0',
        n: 'NOMBRE PIRATA',                    // debe ignorarse
        p: 99999,                              // precio global: debe ignorarse
        st: [111, 5, 111, 111],                // solo la posición 1 aplica
        vis: [false, false, false, false],     // solo la posición 1 aplica
        px: [1, 990, 1, 1],                    // solo la posición 1 aplica
      },
    });
    assert.equal(estado, 200);
    assert.equal(datos.alcance, 'sucursal');
    const p0 = datos.productos.find((x) => x.id === 'p0');
    assert.equal(p0.n, antes.n);
    assert.equal(p0.p, antes.p);
    assert.equal(p0.st[1], 5);
    assert.equal(p0.st[0], antes.st[0]);
    assert.equal(p0.vis[1], false);
    assert.equal(p0.vis[0], true);
    assert.equal(p0.px[1], 990);
    assert.equal(p0.px[0], null);
  });

  it('no puede crear productos nuevos (404)', async () => {
    const { estado } = await llamar('/api/productos', {
      metodo: 'PUT',
      cookieExplicita: cookieSuc,
      cuerpo: { id: 'inventado-qa', n: 'Inventado', st: [1, 1, 1, 1] },
    });
    assert.equal(estado, 404);
  });

  it('no puede borrar productos ni sucursales ni restaurar (403)', async () => {
    const borrarProducto = await llamar('/api/productos?id=p1', { metodo: 'DELETE', cookieExplicita: cookieSuc });
    assert.equal(borrarProducto.estado, 403);

    const borrarSucursal = await llamar('/api/sucursales?id=nunoa', { metodo: 'DELETE', cookieExplicita: cookieSuc });
    assert.equal(borrarSucursal.estado, 403);

    const editarSucursal = await llamar('/api/sucursales', {
      metodo: 'PUT',
      cookieExplicita: cookieSuc,
      cuerpo: { nombre: 'Pirata', direccion: 'x', whatsapp: '56900000000' },
    });
    assert.equal(editarSucursal.estado, 403);

    const restaurar = await llamar('/api/catalogo?accion=restaurar', { metodo: 'POST', cookieExplicita: cookieSuc });
    assert.equal(restaurar.estado, 403);

    const reemplazar = await llamar('/api/catalogo', {
      metodo: 'PUT',
      cookieExplicita: cookieSuc,
      cuerpo: { productos: [], sucursales: [] },
    });
    assert.equal(reemplazar.estado, 403);
  });

  it('solo ve los pedidos de su sucursal', async () => {
    for (const [id, sucursalId, nombre] of [
      ['o-sevilla-1', 'sevilla', 'Sevilla 1201'],
      ['o-nunoa-1', 'nunoa', 'Simón Bolívar 3751'],
    ]) {
      await llamar('/api/pedidos', {
        metodo: 'POST',
        conCookie: false,
        cuerpo: { id, sucursalId, sucursalNombre: nombre, items: [{ n: 'X', p: 1000, c: 1 }] },
      });
    }

    const suyos = await llamar('/api/pedidos', { cookieExplicita: cookieSuc });
    assert.equal(suyos.estado, 200);
    assert.equal(suyos.datos.alcance, 'sevilla');
    assert.deepEqual(suyos.datos.pedidos.map((o) => o.id), ['o-sevilla-1']);

    const todos = await llamar('/api/pedidos');
    assert.equal(todos.datos.alcance, 'global');
    assert.equal(todos.datos.pedidos.length >= 2, true);
  });

  it('no puede borrar el historial (403)', async () => {
    const { estado } = await llamar('/api/pedidos?todos=1', { metodo: 'DELETE', cookieExplicita: cookieSuc });
    assert.equal(estado, 403);
    await llamar('/api/pedidos?todos=1', { metodo: 'DELETE' });
  });
});

/* ------------- invariante de vis/px con las sucursales ---------- */

describe('invariante de vis[] y px[]', () => {
  it('el catálogo de fábrica trae vis y px alineados', async () => {
    await llamar('/api/catalogo?accion=restaurar', { metodo: 'POST' });
    const { datos } = await llamar('/api/catalogo');
    for (const p of datos.productos) {
      assert.equal(p.vis.length, 4);
      assert.equal(p.px.length, 4);
      assert.deepEqual(p.vis, [true, true, true, true]);
      assert.deepEqual(p.px, [null, null, null, null]);
    }
  });

  it('crear una sucursal agrega posición visible y sin precio especial', async () => {
    /* Dejamos huella en la sucursal del medio para verificar el reindexado. */
    await llamar('/api/productos', {
      metodo: 'PUT',
      cuerpo: (() => {
        const base = { id: 'p0', n: 'Paracetamol 500 mg', pres: '20 comprimidos', lab: 'Laboratorio Chile', act: 'Paracetamol', cat: 'medicamentos', il: 'caja', p: 1290 };
        return { ...base, st: [1, 2, 3, 4], vis: [true, false, true, true], px: [null, 990, null, null] };
      })(),
    });

    const { datos } = await llamar('/api/sucursales', {
      metodo: 'PUT',
      cuerpo: {
        nombre: 'Sucursal Vis QA', corto: 'Vis QA', comuna: 'Recoleta',
        direccion: 'Calle Vis 1', telefono: '+56 9 0000 0000', whatsapp: '56900001111',
        horario: [{ d: [1], et: 'Lunes', abre: '09:00', cierra: '18:00' }],
      },
    });
    assert.equal(datos.sucursales.length, 5);
    for (const p of datos.productos) {
      assert.equal(p.vis.length, 5);
      assert.equal(p.px.length, 5);
      assert.equal(p.vis[4], true);
      assert.equal(p.px[4], null);
    }
    const p0 = datos.productos.find((x) => x.id === 'p0');
    assert.deepEqual(p0.vis.slice(0, 4), [true, false, true, true]);
    assert.deepEqual(p0.px.slice(0, 4), [null, 990, null, null]);
  });

  it('eliminar una sucursal conserva vis y px por id', async () => {
    const { datos } = await llamar('/api/sucursales?id=sevilla', { metodo: 'DELETE' });
    assert.equal(datos.sucursales.length, 4);
    const p0 = datos.productos.find((x) => x.id === 'p0');
    /* Se fue Sevilla (posición 1): las banderas y precios de las otras se mantienen. */
    assert.deepEqual(p0.vis, [true, true, true, true]);
    assert.deepEqual(p0.px, [null, null, null, null]);
    assert.deepEqual(p0.st, [1, 3, 4, 0]);
    for (const p of datos.productos) {
      assert.equal(p.vis.length, 4);
      assert.equal(p.px.length, 4);
    }
  });
});

/* ------------------- saneamiento de importación ----------------- */

describe('PUT /api/catalogo (importación) sanea las filas sucias', () => {
  it('corrige precios, categorías, visibilidad y precios por sucursal', async () => {
    await llamar('/api/catalogo?accion=restaurar', { metodo: 'POST' });
    const { estado, datos } = await llamar('/api/catalogo', {
      metodo: 'PUT',
      cuerpo: {
        sucursales: (await llamar('/api/catalogo')).datos.sucursales,
        productos: [
          {
            id: 'Fila SUCIA #1', n: '  Ibuprofeno  400 mg ', pres: '20 comprimidos',
            lab: 'Mintlab', act: 'Ibuprofeno', cat: 'no-existe', il: 'ovni',
            p: -5000, st: ['12', -3, 4.9, null], vis: [false, 'sí', 1, undefined],
            px: [-100, '990', 0, 'nada'],
          },
          { n: 'Sin id ni nada' },      // sin id → se descarta
          { id: 'vacio', n: '' },       // sin nombre → se descarta
        ],
      },
    });

    assert.equal(estado, 200);
    assert.equal(datos.productos.length, 1);
    const p = datos.productos[0];
    assert.equal(p.id, 'fila-sucia-1');
    assert.equal(p.n, 'Ibuprofeno 400 mg');
    assert.equal(p.cat, 'medicamentos');
    assert.equal(p.il, 'caja');
    assert.equal(p.p, 0);
    assert.deepEqual(p.st, [12, 0, 4, 0]);
    assert.deepEqual(p.vis, [false, true, true, true]);
    assert.deepEqual(p.px, [null, 990, null, null]);
  });

  it('deja el catálogo de fábrica listo para las siguientes pruebas', async () => {
    const { datos } = await llamar('/api/catalogo?accion=restaurar', { metodo: 'POST' });
    assert.equal(datos.productos.length, 30);
  });
});
