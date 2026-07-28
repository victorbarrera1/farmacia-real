import type { Sucursal } from '../types';

/* ================================================================
   SUCURSALES — edita aquí para actualizar locales y horarios.
   Días: 0 = domingo … 6 = sábado. Usa `cerrado: true` sin horas.
   ================================================================ */
export const SUCURSALES: Sucursal[] = [
  {
    id: 'independencia', nombre: 'Independencia 1443', corto: 'Independencia 1443', comuna: 'Independencia',
    direccion: 'Av. Independencia 1443, Independencia',
    telefono: '+56 9 4018 4554', whatsapp: '56940184554',
    horario: [
      { d: [1, 2, 3, 4, 5], et: 'Lunes a viernes', abre: '08:30', cierra: '21:00' },
      { d: [6], et: 'Sábado', abre: '09:00', cierra: '21:00' },
      { d: [0], et: 'Domingo', abre: '10:00', cierra: '15:00' },
    ],
    mapa: 'Av. Independencia 1443, Independencia, Región Metropolitana, Chile',
  },
  {
    id: 'sevilla', nombre: 'Sevilla 1201', corto: 'Sevilla 1201', comuna: 'Independencia',
    direccion: 'Calle Sevilla 1201-1205, Independencia',
    telefono: '+56 9 8571 5937', whatsapp: '56985715937',
    horario: [
      { d: [1, 2, 3, 4, 5], et: 'Lunes a viernes', abre: '09:00', cierra: '20:30' },
      { d: [6], et: 'Sábado', abre: '09:30', cierra: '20:00' },
      { d: [0], et: 'Domingo', cerrado: true },
    ],
    mapa: 'Sevilla 1201, Independencia, Región Metropolitana, Chile',
  },
  {
    id: 'santamaria', nombre: 'Domingo Santa María 1789', corto: 'Santa María 1789', comuna: 'Independencia',
    direccion: 'Av. Domingo Santa María 1789, esq. Vivaceta, Independencia',
    /* TODO: reemplazar por el número propio de esta sucursal */
    telefono: '+56 9 4018 4554', whatsapp: '56940184554',
    horario: [
      { d: [1, 2, 3, 4, 5], et: 'Lunes a viernes', abre: '08:30', cierra: '21:00' },
      { d: [6], et: 'Sábado', abre: '09:00', cierra: '21:00' },
      { d: [0], et: 'Domingo', abre: '10:00', cierra: '14:00' },
    ],
    mapa: 'Av. Domingo Santa María 1789, Independencia, Región Metropolitana, Chile',
  },
  {
    id: 'nunoa', nombre: 'Simón Bolívar 3751', corto: 'Simón Bolívar 3751', comuna: 'Ñuñoa',
    direccion: 'Av. Simón Bolívar 3751-A, Ñuñoa',
    /* TODO: reemplazar por el número propio de esta sucursal */
    telefono: '+56 9 4018 4554', whatsapp: '56940184554',
    horario: [
      { d: [1, 2, 3, 4, 5], et: 'Lunes a viernes', abre: '09:00', cierra: '21:00' },
      { d: [6], et: 'Sábado', abre: '10:00', cierra: '20:00' },
      { d: [0], et: 'Domingo', cerrado: true },
    ],
    mapa: 'Av. Simón Bolívar 3751, Ñuñoa, Región Metropolitana, Chile',
  },
];
