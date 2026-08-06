import { servirNext } from '@/src/server/_lib/next';
import { handler } from '@/src/server/api/stock';

export const maxDuration = 10;
export const PATCH = servirNext(handler);
