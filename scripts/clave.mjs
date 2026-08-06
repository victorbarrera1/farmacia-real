#!/usr/bin/env node
/* ================================================================
   npm run clave -- "MiClaveSegura"
   ----------------------------------------------------------------
   Genera todo lo necesario para proteger el panel:

   · ADMIN_PASS_HASH        → hash scrypt para el servidor (variable de
                              entorno en Vercel). La clave nunca se guarda.
   · ADMIN_SESSION_SECRET   → secreto aleatorio para firmar la cookie.
   · VITE_ADMIN_PASS_HASH   → hash PBKDF2 para el modo sin backend
     VITE_ADMIN_PASS_SALT     (se compara en el navegador; no es control de
                              acceso real, pero no expone la clave).

   No imprime la clave y no escribe archivos: copia y pega los valores.
   ================================================================ */
import { pbkdf2Sync, randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const ITERACIONES_PBKDF2 = 210000;
const N = 16384, r = 8, p = 1;

async function pedirClave() {
  const argumento = process.argv.slice(2).join(' ').trim();
  if (argumento) return argumento;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const clave = (await rl.question('Clave nueva para el panel: ')).trim();
  rl.close();
  return clave;
}

const clave = await pedirClave();
if (clave.length < 10) {
  console.error('\n✖ Usa al menos 10 caracteres, con números y símbolos.');
  console.error('  Ejemplo de uso:  npm run clave -- "Real-2026:Panel!"\n');
  process.exit(1);
}

const salScrypt = randomBytes(16);
const hashScrypt = scryptSync(clave, salScrypt, 32, { N, r, p });
const salPbkdf2 = randomBytes(16);
const hashPbkdf2 = pbkdf2Sync(clave, salPbkdf2, ITERACIONES_PBKDF2, 32, 'sha256');

console.log(`
════════════════════════════════════════════════════════════════
 1) BACKEND (Vercel → Settings → Environment Variables)
════════════════════════════════════════════════════════════════
ADMIN_PASS_HASH=scrypt:${N}:${r}:${p}:${salScrypt.toString('hex')}:${hashScrypt.toString('hex')}
ADMIN_SESSION_SECRET=${randomBytes(32).toString('hex')}

════════════════════════════════════════════════════════════════
 2) MODO SIN BACKEND (src/config.ts → CLAVE_LOCAL, o .env)
════════════════════════════════════════════════════════════════
VITE_ADMIN_PASS_HASH=${hashPbkdf2.toString('hex')}
VITE_ADMIN_PASS_SALT=${salPbkdf2.toString('hex')}
  (iteraciones PBKDF2-SHA256: ${ITERACIONES_PBKDF2})

Recuerda: con el backend configurado, el modo sin backend ya no se usa.
`);
