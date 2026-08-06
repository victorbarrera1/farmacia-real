import { servirNext } from '@/src/server/_lib/next';
import { handler } from '@/src/server/api/estado';

export const maxDuration = 10;
export const GET = servirNext(handler);
