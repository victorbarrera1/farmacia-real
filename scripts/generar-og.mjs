#!/usr/bin/env node
/* ================================================================
   npm run og
   ----------------------------------------------------------------
   Genera `public/og-farmacias-real.png` (1200×630) para las tarjetas de
   WhatsApp, Facebook y X: fondo azul marino de marca, emblema, y los
   nombres reales de las sucursales tomados de src/data/sucursales.ts.

   Necesita Playwright solo para rasterizar. Como el PNG queda commiteado,
   el script solo se corre cuando cambian las sucursales o el diseño:

     npx -y playwright@1 install chromium     (una vez)
     PLAYWRIGHT=$(npm root -g)/playwright npm run og

   Si no encuentra Playwright, avisa y no falla el build.
   ================================================================ */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SUCURSALES } = await import(join(raiz, 'src/data/sucursales.ts'));

async function cargarPlaywright() {
  const candidatos = [process.env.PLAYWRIGHT, 'playwright'].filter(Boolean);
  for (const c of candidatos) {
    try {
      return await import(c);
    } catch {
      /* siguiente candidato */
    }
  }
  return null;
}

const pw = await cargarPlaywright();
if (!pw) {
  console.log('ℹ Playwright no está disponible: se conserva el PNG ya commiteado.');
  console.log('  Para regenerarlo:  npx -y playwright@1 install chromium && npm run og');
  process.exit(0);
}

const EMBLEMA = `<svg viewBox="0 0 24 24" width="132" height="132">
  <path d="M17.66 1H6.34L1 6.34v11.32L6.34 23h11.32L23 17.66V6.34z" fill="#D6202A"/>
  <path d="M17.04 2.5H6.96L2.5 6.96v10.08l4.46 4.46h10.08l4.46-4.46V6.96z" fill="#1B2A55"/>
  <circle cx="12" cy="12" r="6.55" fill="#fff"/>
  <path d="M8.6 8.15h6.8c0 3.1-1.55 4.75-2.75 5.2v1.5h2.15v1.5H9.2v-1.5h2.15v-1.5c-1.2-.45-2.75-2.1-2.75-5.2z" fill="#D6202A"/>
  <path d="M14.75 8.15c.75-2.5-.5-3.85-1.95-3.5-1.3.3-1.5 2-.2 2.4" fill="none" stroke="#D6202A" stroke-width="1.45" stroke-linecap="round"/>
</svg>`;

const CRUZ =
  'polygon(37% 0,63% 0,63% 37%,100% 37%,100% 63%,63% 63%,63% 100%,37% 100%,37% 63%,0 63%,0 37%,37% 37%)';

const html = `<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; display: flex; flex-direction: column; justify-content: center;
    padding: 74px 86px; position: relative; overflow: hidden; color: #fff;
    background: linear-gradient(135deg, #1B2A55 0%, #111B39 100%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .cruz { position: absolute; background: #fff; opacity: .07; clip-path: ${CRUZ}; }
  .c1 { width: 420px; height: 420px; right: -110px; top: -130px; }
  .c2 { width: 260px; height: 260px; background: #D6202A; opacity: .16; right: 250px; bottom: -120px; }
  .marca { display: flex; align-items: center; gap: 22px; }
  .marca b { font-size: 58px; font-weight: 800; letter-spacing: -.03em; line-height: 1; }
  .marca i { font-style: normal; color: #FF6B6F; }
  .marca small { display: block; margin-top: 8px; font-size: 19px; font-weight: 700;
    letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.6); }
  h1 { margin-top: 36px; font-size: 55px; font-weight: 800; letter-spacing: -.02em; line-height: 1.1; max-width: 20ch; }
  p { margin-top: 18px; font-size: 27px; line-height: 1.4; color: rgba(255,255,255,.86); max-width: 34ch; }
  .locales { margin-top: 40px; display: flex; flex-wrap: wrap; gap: 12px; max-width: 92%; }
  .chip { border: 2px solid rgba(255,255,255,.26); border-radius: 999px; padding: 10px 20px;
    font-size: 20px; font-weight: 700; }
  .sello { position: absolute; right: 86px; top: 74px; background: #D6202A; border-radius: 999px;
    padding: 13px 26px; font-size: 21px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
</style></head><body>
  <span class="cruz c1"></span><span class="cruz c2"></span>
  <span class="sello">Retiro en tienda</span>
  <div class="marca">${EMBLEMA}<span><b>Farmacias <i>Real</i></b><small>Tu farmacia de barrio</small></span></div>
  <h1>Revisa el stock de tu local y resérvalo por WhatsApp</h1>
  <p>Catálogo informativo. El pago y la entrega son presenciales en la farmacia.</p>
  <div class="locales">
    ${SUCURSALES.map((s) => `<span class="chip">${s.corto} · ${s.comuna}</span>`).join('\n    ')}
  </div>
</body></html>`;

const navegador = await pw.chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await pagina.setContent(html, { waitUntil: 'load' });
const png = await pagina.screenshot({ type: 'png' });
await navegador.close();

const destino = join(raiz, 'public/og-farmacias-real.png');
await writeFile(destino, png);
console.log(`✓ public/og-farmacias-real.png (${(png.length / 1024).toFixed(0)} kB) con ${SUCURSALES.length} sucursales`);
