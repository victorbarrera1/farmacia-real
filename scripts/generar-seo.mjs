#!/usr/bin/env node
/* ================================================================
   npm run seo
   ----------------------------------------------------------------
   Genera el SEO estático a partir de la ÚNICA fuente de verdad
   (`src/data/sucursales.ts` y `src/config.ts`), para que nunca se
   desincronice con los datos reales:

   · index.html → bloque JSON-LD (schema.org Pharmacy por sucursal)
     entre los marcadores <!-- ld:inicio --> y <!-- ld:fin -->.
   · public/sitemap.xml
   · public/robots.txt

   El JSON-LD estático es el que ven los crawlers (esta es una SPA: si se
   inyectara solo con JavaScript, Google podría no verlo). En runtime, el
   componente StructuredData únicamente lo reemplaza si el panel editó las
   sucursales.
   ================================================================ */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SUCURSALES } = await import(join(raiz, 'src/data/sucursales.ts'));
const { SITIO_URL } = await import(join(raiz, 'src/config.ts'));

const DIA = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

const hoy = new Date().toISOString().slice(0, 10);

/* ------------------------------ JSON-LD ------------------------ */

const farmacias = SUCURSALES.map((s) => ({
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

const grafo = {
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
        'Catálogo informativo con reserva de stock por WhatsApp y retiro presencial en las sucursales de Farmacias Real.',
    },
    ...farmacias,
  ],
};

/* --------------------------- index.html ------------------------ */

const rutaIndex = join(raiz, 'index.html');
const html = await readFile(rutaIndex, 'utf8');
const INICIO = '<!-- ld:inicio -->';
const FIN = '<!-- ld:fin -->';

if (!html.includes(INICIO) || !html.includes(FIN)) {
  console.error(`✖ Faltan los marcadores ${INICIO} / ${FIN} en index.html`);
  process.exit(1);
}

const bloque = `${INICIO}
<script type="application/ld+json" id="ld-pharmacy">
${JSON.stringify(grafo, null, 2)}
</script>
${FIN}`;

const htmlNuevo =
  html.slice(0, html.indexOf(INICIO)) + bloque + html.slice(html.indexOf(FIN) + FIN.length);
await writeFile(rutaIndex, htmlNuevo, 'utf8');

/* ---------------------------- sitemap -------------------------- */

await mkdir(join(raiz, 'public'), { recursive: true });

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/generar-seo.mjs · no editar a mano -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITIO_URL}/</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
await writeFile(join(raiz, 'public/sitemap.xml'), sitemap, 'utf8');

/* ----------------------------- robots -------------------------- */

const robots = `# Farmacias Real — generado por scripts/generar-seo.mjs
User-agent: *
Allow: /
# El panel de gestión no se indexa
Disallow: /panel
Disallow: /api/

Sitemap: ${SITIO_URL}/sitemap.xml
`;
await writeFile(join(raiz, 'public/robots.txt'), robots, 'utf8');

/* --------------------------- validación ------------------------ */

const problemas = [];
JSON.parse(JSON.stringify(grafo)); /* debe ser JSON serializable */
farmacias.forEach((f) => {
  if (!f.name) problemas.push(`${f['@id']}: falta name`);
  if (!f.address.streetAddress || f.address.streetAddress === '—') {
    problemas.push(`${f['@id']}: falta dirección`);
  }
  if (!/^\+?\d[\d]{7,}$/.test(f.telephone)) problemas.push(`${f['@id']}: teléfono dudoso (${f.telephone})`);
  if (!f.openingHoursSpecification.length) problemas.push(`${f['@id']}: sin horarios`);
});

const telefonos = new Map();
SUCURSALES.forEach((s) => telefonos.set(s.whatsapp, [...(telefonos.get(s.whatsapp) ?? []), s.id]));
const repetidos = [...telefonos.entries()].filter(([, ids]) => ids.length > 1);

console.log(`SEO generado para ${SITIO_URL}`);
console.log(`  · index.html      → JSON-LD con ${farmacias.length} sucursales + Organization + WebSite`);
console.log('  · public/sitemap.xml, public/robots.txt');
if (problemas.length) {
  console.log('\n⚠ Revisar:');
  problemas.forEach((p) => console.log(`  - ${p}`));
}
if (repetidos.length) {
  console.log('\n⚠ WhatsApp repetido entre sucursales (falta el número real del cliente):');
  repetidos.forEach(([wa, ids]) => console.log(`  - ${wa} → ${ids.join(', ')}`));
}
if (!problemas.length && !repetidos.length) console.log('\n✓ Sin observaciones.');
