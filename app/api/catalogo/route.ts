import { servirNext } from '@/src/server/_lib/next';
import { handler } from '@/src/server/api/catalogo';

export const maxDuration = 10;
export const GET = servirNext(handler);
export const PUT = servirNext(handler);
export const POST = servirNext(handler);
