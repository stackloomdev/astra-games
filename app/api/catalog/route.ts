import { handleCatalog } from '@/lib/catalog';

// The parser needs node:crypto and the remark toolchain — Node runtime, not edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * JSON mirror of the catalogue, kept at the same shape the previous site served
 * so anything already pointing at `/api/catalog` keeps working. Caching headers
 * are set by the service itself.
 */
export async function GET(request: Request) {
  return handleCatalog(request);
}

export async function HEAD(request: Request) {
  return handleCatalog(request);
}
