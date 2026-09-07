import type { Catalog, Work } from './catalog';

export interface PreviewResult {
  body?: Buffer;
  contentType?: string;
  location?: string;
  unavailable?: boolean;
  kind: 'author-image' | 'screenshot' | 'repository-card' | 'unavailable';
  maxAge: number;
}

export function isPublicAddress(address: string): boolean;
export function validatePreviewUrl(value: string): URL;
export function fetchPublicResource(
  value: string,
  options?: { maxBytes?: number; timeoutMs?: number; redirects?: number },
): Promise<{ body: Buffer; contentType: string; url: string }>;
export function extractOpenGraphImage(html: string, pageUrl: string): string | null;
export function githubRepositoryUrl(work: Work): string | null;
export function resolvePreview(work: Work, options?: { fetcher?: typeof fetchPublicResource }): Promise<PreviewResult>;
export function createPreviewResponder(options: {
  loadCatalogFor: (locale: string) => Promise<Catalog>;
  isLocale: (value: string) => boolean;
  defaultLocale: string;
  getPreview?: (work: Work) => Promise<PreviewResult>;
}): (request: Request) => Promise<Response>;
