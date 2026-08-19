import { SUCURSALES } from '../data/sucursales.ts';
import { SITIO_URL } from '../config.ts';

/* ================================================================
   SEO — datos estructurados (schema.org Pharmacy).
   ----------------------------------------------------------------
   Una sola fuente: los datos de `src/data/sucursales.ts`. Lo consumen
   por igual el layout de Next (JSON-LD estático que ven los crawlers) y
   el script `npm run seo` (validación + sitemap + robots).
   ================================================================ */

const DIA: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

export interface FarmaciaJSONLD {
  '@type': 'Pharmacy';
  '@id': string;
  name: string;
  url: string;
  image: string;
  telephone: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  areaServed: string;
  currenciesAccepted: string;
  paymentAccepted: string;
  publicAccess: boolean;
  isAccessibleForFree: boolean;
  hasMap: string;
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
}

export function farmaciasJSONLD(): FarmaciaJSONLD[] {
  return SUCURSALES.map((s) => ({
    '@type': 'Pharmacy',
    '@id': `${SITIO_URL}/#${s.id}`,
    name: `Farmacias Real — ${s.nombre}`,
    url: SITIO_URL,
    image: `${SITIO_URL}/og-farmacias-real.png`,
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
    paymentAccepted: 'Efectivo, débito y crédito en el local',
    publicAccess: true,
    isAccessibleForFree: true,
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.mapa)}`,
    openingHoursSpecification: s.horario
      .filter((t) => !t.cerrado)
      .map((t) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: t.d.map((d) => DIA[d]),
        opens: t.abre,
        closes: t.cierra,
      })),
  }));
}

/** @graph completo: Organization + WebSite + las sucursales. */
export function grafoJSONLD(): Record<string, unknown> {
  const farmacias = farmaciasJSONLD();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITIO_URL}/#organizacion`,
        name: 'Farmacias Real',
        url: SITIO_URL,
        logo: `${SITIO_URL}/og-farmacias-real.png`,
        sameAs: ['https://instagram.com/farmaciareal4'],
        areaServed: ['Independencia', 'Ñuñoa'],
        department: farmacias.map((f) => ({ '@id': f['@id'] })),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITIO_URL}/#sitio`,
        url: SITIO_URL,
        name: 'Farmacias Real',
        inLanguage: 'es-CL',
        publisher: { '@id': `${SITIO_URL}/#organizacion` },
        description:
          'Catálogo informativo con cotización por WhatsApp y retiro presencial en las sucursales de Farmacias Real.',
      },
      ...farmacias,
    ],
  };
}
