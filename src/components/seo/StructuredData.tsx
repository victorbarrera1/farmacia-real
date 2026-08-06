import { useEffect } from 'react';
import { SITIO_URL } from '../../config';
import { SUCURSALES } from '../../data/sucursales';
import { useSucursales } from '../../hooks/useDatos';

const DIA: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

/* ================================================================
   Datos estructurados (schema.org Pharmacy).
   ----------------------------------------------------------------
   El JSON-LD que ven los crawlers es ESTÁTICO y vive en index.html
   (lo genera `npm run seo`): en una SPA, lo inyectado por JavaScript
   puede no ser indexado.

   Este componente solo entra en acción si las sucursales vigentes
   difieren de las de fábrica (porque el panel o el backend las editó):
   en ese caso reemplaza el contenido del bloque estático para que la
   información publicada siga siendo la correcta. Si no hay cambios, no
   toca nada y evita duplicar el @graph.
   ================================================================ */
export function StructuredData() {
  const sucursales = useSucursales();

  useEffect(() => {
    const sinCambios = JSON.stringify(sucursales) === JSON.stringify(SUCURSALES);
    const etiqueta = document.getElementById('ld-pharmacy');
    if (sinCambios || !etiqueta) return;

    const original = etiqueta.textContent;
    const farmacias = sucursales.map((s) => ({
      '@type': 'Pharmacy',
      '@id': `${SITIO_URL}/#${s.id}`,
      name: 'Farmacias Real — ' + s.nombre,
      url: SITIO_URL,
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
    }));

    etiqueta.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITIO_URL}/#organizacion`,
          name: 'Farmacias Real',
          url: SITIO_URL,
          sameAs: ['https://instagram.com/farmaciareal4'],
          department: farmacias.map((f) => ({ '@id': f['@id'] })),
        },
        ...farmacias,
      ],
    });

    return () => { etiqueta.textContent = original; };
  }, [sucursales]);

  return null;
}
