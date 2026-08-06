import { servirNext } from '@/src/server/_lib/next';
import { handler } from '@/src/server/api/sucursales';

export const maxDuration = 10;
export const GET = servirNext(handler);
export const PUT = servirNext(handler);
export const DELETE = servirNext(handler);
