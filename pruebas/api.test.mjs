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
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scryptSync, randomBytes } from 'node:crypto';

const CLAVE = 'clave-de-prueba-2026';
const N = 16384, r = 8, p = 1;
const sal = randomBytes(16);
const hash = scryptSync(CLAVE, sal, 32, { N, r, p });

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
  process.env.ADMIN_PASS_HASH = `scrypt$${N}$${r}$${p}$${sal.toString('hex')}$${hash.toString('hex')}`;
  process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString('hex');
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

async function llamar(ruta, { metodo = 'GET', cuerpo, conCookie = true } = {}) {
  const res = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: {
      ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(conCookie && cookie ? { Cookie: cookie } : {}),
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
