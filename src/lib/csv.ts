import type { Producto, Sucursal } from '../types';
import { CATEGORIAS_VALIDAS, ILUSTRACIONES, nuevoIdProducto, sanearId, sanearProducto } from './dominio';

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

const escapar = (v: string | number | undefined): string => {
  const t = String(v ?? '');
  return /[";\n\r,\t]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

const si = (v: boolean | undefined): string => (v ? 'si' : '');

/* ---------------------------- exportar ------------------------- */

export function aCsv(productos: Producto[], sucursales: Sucursal[]): string {
  const cabecera = [...COLUMNAS_BASE, ...sucursales.map(columnaStock)];
  const filas = productos.map((p) =>
    [
      p.id, p.n, p.pres, p.lab, p.act, p.cat, p.il, p.p,
      si(p.be), si(p.rec), si(p.frio), p.desc ?? '',
      ...sucursales.map((_, i) => p.st[i] ?? 0),
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
  const cabecera = partir(lineas[0], sep).map((c) => sanearId(c.replace(/\s+/g, '_'), 60));
  const col = (nombre: string): number => cabecera.indexOf(nombre);

  const iNombre = col('nombre');
  if (iNombre < 0) {
    return {
      productos: [],
      errores: [`Falta la columna "nombre". Columnas encontradas: ${cabecera.join(', ')}.`],
      avisos,
    };
  }

  /* Mapa columna→posición de sucursal, por id y también por nombre corto. */
  const columnasStock = sucursales.map((s, i) => {
    let indice = col(columnaStock(s));
    if (indice < 0) indice = col(sanearId(`stock_${s.corto.replace(/\s+/g, '_')}`, 60));
    if (indice < 0) avisos.push(`Sin columna de stock para ${s.corto}: queda en 0.`);
    return { indice, posicion: i };
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
    columnasStock.forEach(({ indice, posicion }) => {
      if (indice >= 0) st[posicion] = numero(celdas[indice] ?? '');
    });

    const limpio = sanearProducto({
      id,
      n: nombre,
      pres: col('presentacion') >= 0 ? celdas[col('presentacion')] : '',
      lab: col('laboratorio') >= 0 ? celdas[col('laboratorio')] : '',
      act: col('principio_activo') >= 0 ? celdas[col('principio_activo')] : '',
      cat,
      il,
      p: precio,
      be: col('bioequivalente') >= 0 && verdadero(celdas[col('bioequivalente')] ?? ''),
      rec: col('receta') >= 0 && verdadero(celdas[col('receta')] ?? ''),
      frio: col('frio') >= 0 && verdadero(celdas[col('frio')] ?? ''),
      desc: col('descripcion') >= 0 ? celdas[col('descripcion')] : '',
      st,
    });

    if (limpio) productos.push(limpio);
    else errores.push(`Fila ${fila}: no se pudo leer.`);
  });

  if (!productos.length) errores.push('No se pudo leer ningún producto válido.');
  return { productos, errores, avisos };
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
