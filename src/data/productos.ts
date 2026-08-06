import type { Producto } from '../types';

/* ================================================================
   PRODUCTOS — catálogo demo. Reemplazar por la fuente real (API/CSV).
   il = ilustración: caja | frasco | tubo | bomba | tarro | paquete |
        aparato | inhalador | sobre
   st = unidades por sucursal → [independencia, sevilla, santamaria, nunoa]
   vis / px (visibilidad y precio por local) se alinean solos: ver dominio.ts
   El `id` se asigna en runtime (ver useCatalogo / PRODUCTOS_CON_ID).
   ================================================================ */
const RAW: Omit<Producto, 'id' | 'vis' | 'px'>[] = [
  { n: 'Paracetamol 500 mg', pres: '20 comprimidos', lab: 'Laboratorio Chile', act: 'Paracetamol', cat: 'medicamentos', il: 'caja', p: 1290, be: true, st: [38, 24, 31, 19] },
  { n: 'Ibuprofeno 400 mg', pres: '20 comprimidos', lab: 'Mintlab', act: 'Ibuprofeno', cat: 'medicamentos', il: 'caja', p: 2390, be: true, st: [26, 0, 18, 12] },
  { n: 'Loratadina 10 mg', pres: '10 comprimidos', lab: 'Laboratorio Chile', act: 'Loratadina', cat: 'medicamentos', il: 'caja', p: 1790, be: true, st: [41, 15, 6, 22] },
  { n: 'Omeprazol 20 mg', pres: '30 cápsulas', lab: 'Mintlab', act: 'Omeprazol', cat: 'medicamentos', il: 'caja', p: 3990, be: true, st: [17, 9, 25, 0] },
  { n: 'Amoxicilina 500 mg', pres: '21 cápsulas', lab: 'Saval', act: 'Amoxicilina', cat: 'medicamentos', il: 'caja', p: 5490, rec: true, st: [12, 7, 0, 9] },
  { n: 'Losartán 50 mg', pres: '30 comprimidos', lab: 'Andrómaco', act: 'Losartán potásico', cat: 'medicamentos', il: 'caja', p: 4290, be: true, rec: true, st: [22, 14, 16, 11] },
  { n: 'Metformina 850 mg', pres: '30 comprimidos', lab: 'Laboratorio Chile', act: 'Metformina', cat: 'medicamentos', il: 'caja', p: 3690, be: true, rec: true, st: [19, 4, 21, 8] },
  { n: 'Salbutamol inhalador', pres: '200 dosis', lab: 'Saval', act: 'Salbutamol', cat: 'medicamentos', il: 'inhalador', p: 6990, rec: true, st: [8, 0, 5, 7] },
  { n: 'Jarabe para la tos', pres: '120 ml', lab: 'Recalcine', act: 'Ambroxol', cat: 'medicamentos', il: 'frasco', p: 4590, st: [23, 11, 14, 16] },
  { n: 'Sales de rehidratación', pres: 'Caja 5 sobres', lab: 'Laboratorio Chile', act: 'Electrolitos', cat: 'medicamentos', il: 'sobre', p: 3290, st: [30, 18, 9, 13] },

  { n: 'Protector solar FPS 50+', pres: 'Facial 50 ml', lab: 'ISDIN', act: 'Fotoprotección', cat: 'dermo', il: 'tubo', p: 18990, st: [9, 3, 7, 14] },
  { n: 'Crema hidratante piel sensible', pres: 'Frasco 473 ml', lab: 'Cetaphil', act: 'Emoliente', cat: 'dermo', il: 'bomba', p: 15490, st: [6, 0, 4, 11] },
  { n: 'Gel limpiador facial', pres: '200 ml', lab: 'La Roche-Posay', act: 'Effaclar', cat: 'dermo', il: 'bomba', p: 13990, st: [4, 2, 0, 8] },
  { n: 'Crema para manos reparadora', pres: '75 ml', lab: 'Eucerin', act: 'Urea 5%', cat: 'dermo', il: 'tubo', p: 7990, st: [15, 8, 12, 10] },

  { n: 'Vitamina C 1000 mg', pres: '30 comprimidos', lab: 'Mintlab', act: 'Ácido ascórbico', cat: 'vitaminas', il: 'frasco', p: 5990, st: [27, 16, 20, 18] },
  { n: 'Vitamina D3 1000 UI', pres: '60 cápsulas', lab: 'Andrómaco', act: 'Colecalciferol', cat: 'vitaminas', il: 'frasco', p: 8490, st: [13, 5, 0, 9] },
  { n: 'Omega 3 1000 mg', pres: '60 cápsulas', lab: 'Natural Life', act: 'EPA / DHA', cat: 'vitaminas', il: 'frasco', p: 11990, st: [10, 0, 8, 12] },
  { n: 'Multivitamínico adulto', pres: '30 comprimidos', lab: 'Centrum', act: 'Multivitamina', cat: 'vitaminas', il: 'frasco', p: 9990, st: [18, 7, 11, 15] },

  { n: 'Fórmula infantil etapa 1', pres: 'Tarro 800 g', lab: 'NAN', act: 'Nutrición infantil', cat: 'infantil', il: 'tarro', p: 16990, st: [7, 3, 9, 5] },
  { n: 'Pañales bebé talla M', pres: 'Paquete 50 un.', lab: 'Babysec', act: 'Higiene infantil', cat: 'infantil', il: 'paquete', p: 12990, st: [12, 6, 0, 8] },
  { n: 'Toallitas húmedas', pres: 'Paquete 100 un.', lab: 'Huggies', act: 'Higiene infantil', cat: 'infantil', il: 'paquete', p: 3490, st: [24, 14, 19, 17] },
  { n: 'Termómetro digital infantil', pres: '1 unidad', lab: 'Omron', act: 'Medición', cat: 'infantil', il: 'aparato', p: 8990, st: [9, 4, 6, 7] },

  { n: 'Alcohol gel', pres: '250 ml', lab: 'Genérico', act: 'Etanol 70%', cat: 'cuidado', il: 'bomba', p: 2490, st: [35, 22, 28, 20] },
  { n: 'Mascarillas quirúrgicas', pres: 'Caja 50 un.', lab: 'Genérico', act: 'Protección', cat: 'cuidado', il: 'sobre', p: 3990, st: [28, 17, 0, 14] },
  { n: 'Suero fisiológico', pres: 'Ampollas 5 ml x10', lab: 'Sanderson', act: 'NaCl 0,9%', cat: 'cuidado', il: 'sobre', p: 2990, st: [31, 12, 18, 16] },
  { n: 'Pañales adulto talla G', pres: 'Paquete 20 un.', lab: 'Cotidian', act: 'Cuidado en casa', cat: 'cuidado', il: 'paquete', p: 14990, st: [8, 0, 10, 6] },

  { n: 'Medidor de presión digital', pres: 'Brazo, 1 unidad', lab: 'Omron', act: 'Presión arterial', cat: 'equipos', il: 'aparato', p: 44990, st: [4, 2, 3, 5] },
  { n: 'Oxímetro de pulso', pres: '1 unidad', lab: 'Genérico', act: 'Saturación', cat: 'equipos', il: 'aparato', p: 12990, st: [6, 3, 0, 4] },
  { n: 'Test de embarazo', pres: '1 unidad', lab: 'Evatest', act: 'Diagnóstico', cat: 'equipos', il: 'sobre', p: 4990, st: [16, 9, 12, 10] },
  { n: 'Cintas para glicemia', pres: 'Caja 50 un.', lab: 'Accu-Chek', act: 'Glicemia', cat: 'equipos', il: 'sobre', p: 23990, frio: true, st: [5, 0, 7, 3] },
];

/**
 * Catálogo con id estable asignado por índice (`p0`, `p1`, …).
 * `vis` y `px` (visibilidad y precio por sucursal) los rellena
 * `alinearStock` de src/lib/dominio.ts según la cantidad de sucursales:
 * visible en todas y sin precio especial.
 */
export const PRODUCTOS: Producto[] = RAW.map((p, i) => ({ ...p, id: `p${i}`, vis: [], px: [] }));
