import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const runtimeRequire = createRequire(
  '/Users/victor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json',
);
const { chromium } = runtimeRequire('playwright');

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(repo, 'tmp', 'propuesta');
const snapshot = path.join(tmp, 'snapshot');
const captures = path.join(tmp, 'capturas');
const chrome = chromium.executablePath();

await fs.rm(snapshot, { recursive: true, force: true });
await fs.mkdir(snapshot, { recursive: true });
await fs.mkdir(captures, { recursive: true });
await fs.cp(path.join(repo, '.next', 'static'), path.join(snapshot, '_next', 'static'), {
  recursive: true,
});

async function prepararHtml(sourceName, targetName) {
  const source = path.join(repo, '.next', 'server', 'app', sourceName);
  let html = await fs.readFile(source, 'utf8');
  html = html
    .replaceAll('href="/_next/', 'href="./_next/')
    .replaceAll('src="/_next/', 'src="./_next/')
    .replaceAll('href="/og-farmacias-real.png"', `href="${pathToFileURL(path.join(repo, 'public', 'og-farmacias-real.png')).href}"`);
  await fs.writeFile(path.join(snapshot, targetName), html, 'utf8');
}

await prepararHtml('index.html', 'index.html');
await prepararHtml('panel.html', 'panel.html');

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ['--allow-file-access-from-files', '--disable-web-security'],
});

async function captura(fileName, outputName, viewport, y = 0) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1.5,
    javaScriptEnabled: false,
    colorScheme: 'light',
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(snapshot, fileName)).href, { waitUntil: 'load' });
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.screenshot({
    path: path.join(captures, outputName),
    clip: { x: 0, y, width: viewport.width, height: viewport.height },
  });
  await context.close();
}

await captura('index.html', 'catalogo-desktop.png', { width: 1440, height: 980 });
await captura('index.html', 'catalogo-productos.png', { width: 1440, height: 900 }, 260);
await captura('index.html', 'catalogo-mobile.png', { width: 390, height: 844 });
await captura('panel.html', 'panel-login.png', { width: 1280, height: 820 });

await browser.close();
console.log(captures);
