#!/usr/bin/env node
/* ================================================================
   npm run seo
   ----------------------------------------------------------------
   Valida y genera el SEO estático a partir de la ÚNICA fuente de verdad
   (`src/data/sucursales.ts` y `src/config.ts`), para que nunca se
   desincronice con los datos reales:

   · valida el JSON-LD (schema.org Pharmacy) — el bloque estático que
     sirve el layout de Next se genera con la misma función `grafoJSONLD`.
   · public/sitemap.xml
   · public/robots.txt

   En runtime, el componente StructuredData únicamente reemplaza el JSON-LD
   del layout si el panel editó las sucursales.
   ================================================================ */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { farmaciasJSONLD, grafoJSONLD } from '../src/lib/seo.ts';
import { SUCURSALES } from '../src/data/sucursales.ts';
import { SITIO_URL } from '../src/config.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const hoy = new Date().toISOString().slice(0, 10);

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

const grafo = grafoJSONLD();
const farmacias = farmaciasJSONLD();
const problemas = [];
JSON.stringify(grafo); /* debe ser JSON serializable */
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
console.log(`  · JSON-LD con ${farmacias.length} sucursales + Organization + WebSite (lo sirve el layout)`);
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
