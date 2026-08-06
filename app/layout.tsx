import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../src/index.css';
import { SITIO_URL } from '../src/config';
import { grafoJSONLD } from '../src/lib/seo';
import { ClientInit } from './ClientInit';

/* ================================================================
   LAYOUT RAIZ — el SEO que antes vivía en index.html.
   ----------------------------------------------------------------
   Los crawlers ven el JSON-LD estático (generado desde
   src/data/sucursales.ts); el componente StructuredData de la tienda
   solo lo reemplaza en runtime si el panel edita las sucursales.
   ================================================================ */

const TITULO = 'Farmacias Real · Catálogo y reserva por WhatsApp en Independencia y Ñuñoa';
const DESCRIPCION =
  'Farmacias Real: 4 sucursales en Independencia y Ñuñoa. Busca tu remedio, revisa el stock de tu local y resérvalo por WhatsApp. Retiro y pago presencial en la farmacia, sin venta en línea.';
const OG_IMAGEN = `${SITIO_URL}/og-farmacias-real.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  authors: [{ name: 'Farmacias Real' }],
  manifest: '/site.webmanifest',
  other: {
    'geo.region': 'CL-RM',
    'geo.placename': 'Independencia, Ñuñoa, Santiago',
  },
  openGraph: {
    type: 'website',
    siteName: 'Farmacias Real',
    url: `${SITIO_URL}/`,
    title: 'Farmacias Real · Catálogo y reserva por WhatsApp',
    description:
      '4 sucursales en Independencia y Ñuñoa. Revisa el stock de tu local y reserva por WhatsApp. Retiro y pago presencial en la farmacia.',
    locale: 'es_CL',
    images: [
      {
        url: OG_IMAGEN,
        secureUrl: OG_IMAGEN,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Farmacias Real — catálogo con stock por sucursal y reserva por WhatsApp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farmacias Real · Catálogo y reserva por WhatsApp',
    description:
      '4 sucursales en Independencia y Ñuñoa. Revisa el stock de tu local y reserva por WhatsApp. Retiro y pago presencial.',
    images: [OG_IMAGEN],
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><path d=\'M17.66 1H6.34L1 6.34v11.32L6.34 23h11.32L23 17.66V6.34z\' fill=\'%23D6202A\'/><path d=\'M17.04 2.5H6.96L2.5 6.96v10.08l4.46 4.46h10.08l4.46-4.46V6.96z\' fill=\'%231B2A55\'/><circle cx=\'12\' cy=\'12\' r=\'6.55\' fill=\'%23fff\'/><path d=\'M8.6 8.15h6.8c0 3.1-1.55 4.75-2.75 5.2v1.5h2.15v1.5H9.2v-1.5h2.15v-1.5c-1.2-.45-2.75-2.1-2.75-5.2z\' fill=\'%23D6202A\'/></svg>',
    apple: '/og-farmacias-real.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1B2A55',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <body>
        <a className="skip-link" href="#catalogo">Saltar al catálogo</a>
        <script
          type="application/ld+json"
          id="ld-pharmacy"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(grafoJSONLD()) }}
        />
        <ClientInit />
        {children}
      </body>
    </html>
  );
}
