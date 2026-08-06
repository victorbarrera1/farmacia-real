import { servirNext } from '@/src/server/_lib/next';
import { handler } from '@/src/server/api/sesion';

export const maxDuration = 10;
export const GET = servirNext(handler);
export const POST = servirNext(handler);
export const DELETE = servirNext(handler);
