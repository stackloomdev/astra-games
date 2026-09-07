export type WorkCategory = 'game' | 'website' | 'app' | 'tool' | 'experiment' | 'other';

export interface Work {
  id: string;
  name: string;
  description: string;
  category: WorkCategory;
  sourceCategory: string;
  author: { name: string; url: string | null };
  demoUrl: string | null;
  sourceUrl: string | null;
  repoUrl: string | null;
  imageUrl: string | null;
  sourceOrder: number;
}

export interface CatalogSource {
  repository: string;
  url: string;
  checkedAt: string;
  lastSuccessfulAt: string | null;
  revision?: string;
  stale: boolean;
  status: 'fresh' | 'stale' | 'fallback' | 'unavailable';
  error?: string;
}

export interface Catalog {
  works: Work[];
  source: CatalogSource;
  refreshAfterSeconds: number;
}

export const REPOSITORY: string;
export const README_PATH: string;
export const README_URL: string;
export const RAW_URL: string;
export const REFRESH_SECONDS: number;

export function parseCatalogMarkdown(markdown: string, options?: Record<string, unknown>): Work[];
export function classifyWork(sourceCategory: string, description?: string, parents?: string): WorkCategory;
export function safeUrl(input: string, options?: Record<string, unknown>): string | null;
export function createCatalogService(options?: Record<string, unknown>): {
  loadCatalog: () => Promise<Catalog>;
  handleCatalog: (request?: Request) => Promise<Response>;
};
export function loadCatalog(): Promise<Catalog>;
export function handleCatalog(request?: Request): Promise<Response>;
