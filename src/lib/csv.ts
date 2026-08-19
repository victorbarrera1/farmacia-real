import type { Producto, Sucursal } from '../types';
import { CATEGORIAS_VALIDAS, ILUSTRACIONES, nuevoIdProducto, sanearId, sanearProducto } from './dominio.ts';

/* ================================================================
   CSV DEL CATÁLOGO — lógica pura (sin React ni DOM).
   ----------------------------------------------------------------
   Sirve para las dos direcciones del P2 "catálogo real":

   · Exportar: el dueño baja el catálogo, lo edita en Excel o Sheets y lo
     vuelve a subir. También es el respaldo del panel.
   · Importar: si la farmacia tiene una planilla o un listado del POS, se
     convierte a este CSV y se carga de una vez.

   Se usa `;` como separador (es lo que espera Excel en es-CL) y se escribe
   BOM UTF-8 para que las tildes no se rompan. Al importar se acepta `;`,
   `,` o tabulación.
   ================================================================ */

const COLUMNAS_BASE = [
  'id', 'nombre', 'presentacion', 'laboratorio', 'principio_activo', 'categoria',
  'ilustracion', 'precio', 'bioequivalente', 'receta', 'frio', 'descripcion',
] as const;

/** Encabezado de stock por sucursal: `stock_<id>`. */
const columnaStock = (s: Sucursal): string => `stock_${s.id}`;
/** Precio propio de la sucursal (vacío = usa el precio de lista). */
const columnaPrecio = (s: Sucursal): string => `precio_${s.id}`;
/** Visibilidad en la tienda de esa sucursal (`si` / `no`). */
const columnaVisible = (s: Sucursal): string => `visible_${s.id}`;

/** Un valor de texto que empieza así, Excel/Sheets lo puede interpretar como
 *  fórmula al abrir el CSV ("CSV injection"). Solo aplica a texto libre
 *  (nombre, laboratorio, descripción, etc.); nunca a números calculados. */
const FORMULA_PELIGROSA = /^[=+\-@]/;

const escapar = (v: string | number | undefined): string => {
  let t = String(v ?? '');
  if (typeof v === 'string' && FORMULA_PELIGROSA.test(t)) t = `'${t}`;
  return /[";\n\r,\t]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

const si = (v: boolean | undefined): string => (v ? 'si' : '');

/* ---------------------------- exportar ------------------------- */

export function aCsv(productos: Producto[], sucursales: Sucursal[]): string {
  const cabecera = [
    ...COLUMNAS_BASE,
    ...sucursales.flatMap((s) => [columnaStock(s), columnaPrecio(s), columnaVisible(s)]),
  ];
  const filas = productos.map((p) =>
    [
      p.id, p.n, p.pres, p.lab, p.act, p.cat, p.il, p.p,
      si(p.be), si(p.rec), si(p.frio), p.desc ?? '',
      ...sucursales.flatMap((_, i) => [
        p.st[i] ?? 0,
        p.px[i] ?? '',
        p.vis[i] === false ? 'no' : 'si',
      ]),
    ]
      .map(escapar)
      .join(';'),
  );
  /* BOM para que Excel reconozca UTF-8. */
  return `\uFEFF${cabecera.join(';')}\n${filas.join('\n')}\n`;
}

/* ---------------------------- importar ------------------------- */

/** Parte una línea CSV respetando comillas dobles. */
function partir(linea: string, sep: string): string[] {
  const out: string[] = [];
  let actual = '';
  let enComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (enComillas) {
      if (c === '"' && linea[i + 1] === '"') { actual += '"'; i++; }
      else if (c === '"') enComillas = false;
      else actual += c;
    } else if (c === '"') enComillas = true;
    else if (c === sep) { out.push(actual); actual = ''; }
    else actual += c;
  }
  out.push(actual);
  return out.map((t) => t.trim());
}

const detectarSeparador = (cabecera: string): string => {
  const candidatos = [';', '\t', ','];
  return candidatos.reduce((mejor, c) =>
    cabecera.split(c).length > cabecera.split(mejor).length ? c : mejor,
  candidatos[0]);
};

/**
 * Normaliza un encabezado conservando los guiones bajos: `Stock Sevilla` y
 * `stock_sevilla` deben apuntar a la misma columna. No sirve `sanearId`, que
 * convierte `_` en `-` (es para ids, no para nombres de columna).
 */
const normalizarCabecera = (c: string): string =>
  c
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

const verdadero = (v: string): boolean =>
  ['si', 'sí', 'x', '1', 'true', 'verdadero'].includes(v.trim().toLowerCase());

const numero = (v: string): number => {
  /* Acepta "1.290", "1290", "$1.290" y "1290,5". */
  const limpio = v.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const n = Number(limpio);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
};

export interface ResultadoCsv {
  productos: Producto[];
  /** Problemas por fila, para mostrarlos antes de reemplazar nada. */
  errores: string[];
  /** Avisos que no impiden importar. */
  avisos: string[];
}

/**
 * Convierte un CSV en productos válidos. No escribe nada: devuelve el
 * resultado para que el panel lo confirme antes de reemplazar el catálogo.
 */
export function desdeCsv(texto: string, sucursales: Sucursal[]): ResultadoCsv {
  const errores: string[] = [];
  const avisos: string[] = [];
  const lineas = texto.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return { productos: [], errores: ['El archivo está vacío.'], avisos };

  const sep = detectarSeparador(lineas[0]);
  const cabecera = partir(lineas[0], sep).map(normalizarCabecera);
  const col = (nombre: string): number => cabecera.indexOf(nombre);

  /* `activo` es el alias corto de `principio_activo` (así lo pide la plantilla). */
  const colAlias = (...nombres: string[]): number => {
    for (const n of nombres) {
      const i = col(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iNombre = col('nombre');
  if (iNombre < 0) {
    return {
      productos: [],
      errores: [`Falta la columna "nombre". Columnas encontradas: ${cabecera.join(', ')}.`],
      avisos,
    };
  }

  /* Mapa columna→posición de sucursal, por id y también por nombre corto. */
  const porSucursal = sucursales.map((s, i) => {
    let stock = col(columnaStock(s));
    if (stock < 0) stock = col(normalizarCabecera(`stock ${s.corto}`));
    if (stock < 0) avisos.push(`Sin columna de stock para ${s.corto}: queda en 0.`);
    return {
      posicion: i,
      stock,
      precio: col(columnaPrecio(s)),
      visible: col(columnaVisible(s)),
    };
  });

  const vistos = new Set<string>();
  const productos: Producto[] = [];

  lineas.slice(1).forEach((linea, n) => {
    const fila = n + 2; /* número de línea en el archivo */
    const celdas = partir(linea, sep);
    const nombre = celdas[iNombre] ?? '';
    if (!nombre) { errores.push(`Fila ${fila}: sin nombre, se omite.`); return; }

    const idBruto = col('id') >= 0 ? celdas[col('id')] ?? '' : '';
    let id = sanearId(idBruto, 48) || sanearId(nombre, 40) || nuevoIdProducto();
    if (vistos.has(id)) {
      avisos.push(`Fila ${fila}: id repetido (${id}), se genera uno nuevo.`);
      id = nuevoIdProducto();
    }
    vistos.add(id);

    const cat = col('categoria') >= 0 ? sanearId(celdas[col('categoria')] ?? '', 40) : '';
    if (cat && !CATEGORIAS_VALIDAS.includes(cat)) {
      avisos.push(`Fila ${fila}: categoría "${cat}" no existe, queda en medicamentos.`);
    }
    const il = col('ilustracion') >= 0 ? sanearId(celdas[col('ilustracion')] ?? '', 20) : '';
    if (il && !ILUSTRACIONES.includes(il as Producto['il'])) {
      avisos.push(`Fila ${fila}: ilustración "${il}" no existe, queda en caja.`);
    }

    const precio = col('precio') >= 0 ? numero(celdas[col('precio')] ?? '') : 0;
    if (!precio) avisos.push(`Fila ${fila}: precio 0 o ilegible en "${nombre}".`);

    const st = sucursales.map(() => 0);
    const px: (number | null)[] = sucursales.map(() => null);
    const vis = sucursales.map(() => true);
    porSucursal.forEach(({ posicion, stock, precio, visible }) => {
      if (stock >= 0) st[posicion] = numero(celdas[stock] ?? '');
      if (precio >= 0) {
        const bruto = (celdas[precio] ?? '').trim();
        px[posicion] = bruto ? numero(bruto) || null : null;
      }
      if (visible >= 0) {
        const bruto = (celdas[visible] ?? '').trim();
        if (bruto) vis[posicion] = verdadero(bruto);
      }
    });

    const limpio = sanearProducto({
      id,
      n: nombre,
      pres: col('presentacion') >= 0 ? celdas[col('presentacion')] : '',
      lab: col('laboratorio') >= 0 ? celdas[col('laboratorio')] : '',
      act: colAlias('principio_activo', 'activo') >= 0
        ? celdas[colAlias('principio_activo', 'activo')]
        : '',
      cat,
      il,
      p: precio,
      be: col('bioequivalente') >= 0 && verdadero(celdas[col('bioequivalente')] ?? ''),
      rec: col('receta') >= 0 && verdadero(celdas[col('receta')] ?? ''),
      frio: col('frio') >= 0 && verdadero(celdas[col('frio')] ?? ''),
      desc: col('descripcion') >= 0 ? celdas[col('descripcion')] : '',
      st,
      px,
      vis,
    });

    if (limpio) productos.push(limpio);
    else errores.push(`Fila ${fila}: no se pudo leer.`);
  });

  if (!productos.length) errores.push('No se pudo leer ningún producto válido.');
  return { productos, errores, avisos };
}

/* --------------------------- plantilla ------------------------- */

/**
 * Plantilla vacía para cargar el catálogo desde Excel: cabecera con las
 * columnas exactas, dos filas de ejemplo y las categorías válidas al pie
 * (como comentario, para que el dueño no tenga que adivinarlas).
 */
export function plantillaCsv(sucursales: Sucursal[]): string {
  const cabecera = [
    ...COLUMNAS_BASE,
    ...sucursales.flatMap((s) => [columnaStock(s), columnaPrecio(s), columnaVisible(s)]),
  ];
  const ejemplo = (n: string, pres: string, lab: string, act: string, cat: string, precio: number, rec: string) =>
    [
      '', n, pres, lab, act, cat, 'caja', precio, '', rec, '', '',
      ...sucursales.flatMap(() => ['0', '', 'si']),
    ]
      .map(escapar)
      .join(';');

  return [
    `\uFEFF${cabecera.join(';')}`,
    ejemplo('Paracetamol 500 mg', '20 comprimidos', 'Laboratorio Chile', 'Paracetamol', 'medicamentos', 1290, ''),
    ejemplo('Amoxicilina 500 mg', '21 cápsulas', 'Saval', 'Amoxicilina', 'medicamentos', 5490, 'si'),
    '',
    `# categorias validas: ${CATEGORIAS_VALIDAS.join(' | ')}`,
    `# ilustraciones: ${ILUSTRACIONES.join(' | ')}`,
    '# bioequivalente / receta / frio: escribe "si" o dejalo en blanco',
    '# precio_<sucursal> en blanco = usa el precio de lista; visible_<sucursal>: si / no',
    '# la columna id puede ir vacia: se genera desde el nombre',
    '',
  ].join('\n');
}

/* --------------------------- respaldo -------------------------- */

export interface Respaldo {
  formato: 'farmacias-real/respaldo';
  version: 1;
  fecha: string;
  productos: Producto[];
  sucursales: Sucursal[];
}

export const armarRespaldo = (productos: Producto[], sucursales: Sucursal[]): Respaldo => ({
  formato: 'farmacias-real/respaldo',
  version: 1,
  fecha: new Date().toISOString(),
  productos,
  sucursales,
});

/** Lee un respaldo JSON. Devuelve null si no tiene el formato esperado. */
export function leerRespaldo(texto: string): { productos: Producto[]; sucursales: Sucursal[] } | null {
  try {
    const g = JSON.parse(texto) as Partial<Respaldo>;
    if (!Array.isArray(g.productos) || !Array.isArray(g.sucursales)) return null;
    return { productos: g.productos, sucursales: g.sucursales };
  } catch {
    return null;
  }
}
