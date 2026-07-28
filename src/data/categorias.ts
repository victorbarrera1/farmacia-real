import type { Categoria } from '../types';

/* ================================================================
   CATEGORÍAS del catálogo. `id: 'todos'` muestra el catálogo completo.
   ================================================================ */
export const CATEGORIAS: Categoria[] = [
  { id: 'todos', et: 'Ver todo', ico: 'i-grilla' },
  { id: 'medicamentos', et: 'Medicamentos', ico: 'i-pastilla' },
  { id: 'dermo', et: 'Dermocosmética', ico: 'i-gota' },
  { id: 'vitaminas', et: 'Vitaminas', ico: 'i-hoja' },
  { id: 'infantil', et: 'Mamá y bebé', ico: 'i-bebe' },
  { id: 'cuidado', et: 'Cuidado personal', ico: 'i-corazon' },
  { id: 'equipos', et: 'Equipos y control', ico: 'i-pulso' },
];
