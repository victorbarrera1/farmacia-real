#!/usr/bin/env node
/* ================================================================
   Generador de claves del panel.

     npm run clave -- "ClaveDelDueño"
         → ADMIN_PASS_HASH + ADMIN_SESSION_SECRET (admin global)
           y, de paso, el hash PBKDF2 para desarrollo sin backend.

     npm run clave -- --sucursal <id> "ClaveDelLocal"
         → una entrada para SUCURSAL_PASS_HASHES.

     npm run clave -- --sucursales
         → una clave aleatoria por cada sucursal de src/data/sucursales.ts
           y el JSON completo de SUCURSAL_PASS_HASHES listo para pegar.

   Las claves no se guardan en ningún archivo: se muestran una vez.
   ================================================================ */
import { pbkdf2Sync, randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ITERACIONES_PBKDF2 = 210000;
const N = 16384, r = 8, p = 1;
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

const hashScrypt = (clave) => {
  const sal = randomBytes(16);
  const hash = scryptSync(clave, sal, 32, { N, r, p });
  return `scrypt:${N}:${r}:${p}:${sal.toString('hex')}:${hash.toString('hex')}`;
};

/** Clave legible pero fuerte, para entregarle a cada encargado. */
const claveAleatoria = () => {
  const silabas = 'bcdfghjkmnpqrstvwxz';
  const vocales = 'aeiou';
  const parte = () =>
    [...Array(3)].map(() =>
      silabas[randomBytes(1)[0] % silabas.length] + vocales[randomBytes(1)[0] % vocales.length],
    ).join('');
  const numero = 100 + (randomBytes(2).readUInt16BE(0) % 900);
  return `${parte()}-${parte()}-${numero}`;
};

const argumentos = process.argv.slice(2);
const bandera = argumentos.find((a) => a.startsWith('--'));
const resto = argumentos.filter((a) => !a.startsWith('--'));

const linea = '════════════════════════════════════════════════════════════════';

/* ------------------- claves de todas las sucursales ------------ */

if (bandera === '--sucursales') {
  const { SUCURSALES } = await import(join(raiz, 'src/data/sucursales.ts'));
  const hashes = {};
  const entregar = [];
  SUCURSALES.forEach((s) => {
    const clave = claveAleatoria();
    hashes[s.id] = hashScrypt(clave);
    entregar.push({ sucursal: s.corto, id: s.id, clave });
  });

  console.log(`\n${linea}\n VARIABLE PARA VERCEL (una sola línea)\n${linea}`);
  console.log(`SUCURSAL_PASS_HASHES=${JSON.stringify(hashes)}`);
  console.log(`\n${linea}\n CLAVES PARA ENTREGAR A CADA ENCARGADO\n${linea}`);
  entregar.forEach((e) => console.log(`  ${e.sucursal.padEnd(22)} (${e.id})  →  ${e.clave}`));
  console.log(`
En /panel, el encargado elige su sucursal en el selector y escribe su clave.
Solo puede editar el stock, el precio y la visibilidad de su local, y ver los
pedidos de su sucursal. Estas claves no quedan guardadas: cópialas ahora.
`);
  process.exit(0);
}

/* ------------------- clave de una sola sucursal ---------------- */

if (bandera === '--sucursal') {
  const id = resto[0];
  const clave = resto.slice(1).join(' ').trim();
  if (!id || clave.length < 8) {
    console.error('\n✖ Uso: npm run clave -- --sucursal <sucursalId> "ClaveDelLocal"\n');
    process.exit(1);
  }
  console.log(`\n${linea}\n Entrada para SUCURSAL_PASS_HASHES\n${linea}`);
  console.log(JSON.stringify({ [id]: hashScrypt(clave) }));
  console.log('\nAgrégala al JSON que ya tengas en la variable (no la reemplaces).\n');
  process.exit(0);
}

/* ----------------------- clave del admin ----------------------- */

async function pedirClave() {
  const argumento = resto.join(' ').trim();
  if (argumento) return argumento;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const clave = (await rl.question('Clave nueva para el panel: ')).trim();
  rl.close();
  return clave;
}

const clave = await pedirClave();
if (clave.length < 10) {
  console.error('\n✖ Usa al menos 10 caracteres, con números y símbolos.');
  console.error('  Ejemplo:  npm run clave -- "Real-2026:Panel!"\n');
  process.exit(1);
}

const salPbkdf2 = randomBytes(16);
const hashPbkdf2 = pbkdf2Sync(clave, salPbkdf2, ITERACIONES_PBKDF2, 32, 'sha256');

console.log(`
${linea}
 1) BACKEND — Vercel → Settings → Environment Variables
${linea}
ADMIN_PASS_HASH=${hashScrypt(clave)}
ADMIN_SESSION_SECRET=${randomBytes(32).toString('hex')}

  Claves por sucursal:  npm run clave -- --sucursales

${linea}
 2) DESARROLLO SIN BACKEND (archivo .env local, nunca en producción)
${linea}
VITE_ADMIN_PASS_HASH=${hashPbkdf2.toString('hex')}
VITE_ADMIN_PASS_SALT=${salPbkdf2.toString('hex')}
  (PBKDF2-SHA256, ${ITERACIONES_PBKDF2} iteraciones)

Con el backend configurado, el modo sin backend no se usa.
`);
