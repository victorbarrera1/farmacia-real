import { useEffect } from 'react';
import { useSucursales } from '../../hooks/useDatos';

const DIA: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

/**
 * Inyecta datos estructurados (schema.org Pharmacy por sucursal) para que
 * Google pueda mostrarlas en búsquedas y Maps. Se generan desde las
 * sucursales vigentes para no desincronizarse al editarlas.
 */
export function StructuredData() {
  const sucursales = useSucursales();

  useEffect(() => {
    const json = {
      '@context': 'https://schema.org',
      '@graph': sucursales.map((s) => ({
        '@type': 'Pharmacy',
        '@id': location.origin + location.pathname + '#' + s.id,
        name: 'Farmacias Real — ' + s.nombre,
        telephone: s.telefono.replace(/\s/g, ''),
        address: {
          '@type': 'PostalAddress',
          streetAddress: s.direccion,
          addressLocality: s.comuna,
          addressRegion: 'Región Metropolitana',
          addressCountry: 'CL',
        },
        areaServed: s.comuna,
        currenciesAccepted: 'CLP',
        openingHoursSpecification: s.horario
          .filter((t) => !t.cerrado)
          .map((t) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: t.d.map((d) => DIA[d]),
            opens: t.abre,
            closes: t.cierra,
          })),
      })),
    };

    const et = document.createElement('script');
    et.type = 'application/ld+json';
    et.textContent = JSON.stringify(json);
    document.head.appendChild(et);
    return () => { et.remove(); };
  }, [sucursales]);

  return null;
}
