import type { Categoria } from '../types';

/* ================================================================
   CATEGORÍAS del catálogo. `id: 'todos'` muestra el catálogo completo.
   `sub` es la bajada que se ve en el mega-menú de categorías.
   ================================================================ */
export const CATEGORIAS: Categoria[] = [
  { id: 'todos', et: 'Ver todo', ico: 'i-grilla', sub: 'Todo el catálogo del local' },
  { id: 'medicamentos', et: 'Medicamentos', ico: 'i-pastilla', sub: 'Bioequivalentes y de marca' },
  { id: 'dermo', et: 'Dermocosmética', ico: 'i-gota', sub: 'Piel, solares y facial' },
  { id: 'perfumeria', et: 'Perfumería', ico: 'i-perfume', sub: 'Fragancias, colonias y cuidado corporal' },
  { id: 'vitaminas', et: 'Vitaminas', ico: 'i-hoja', sub: 'Suplementos y defensas' },
  { id: 'infantil', et: 'Mamá y bebé', ico: 'i-bebe', sub: 'Fórmulas, pañales y aseo' },
  { id: 'cuidado', et: 'Cuidado personal', ico: 'i-corazon', sub: 'Higiene y cuidado en casa' },
  { id: 'equipos', et: 'Equipos y control', ico: 'i-pulso', sub: 'Presión, glicemia y test' },
];
