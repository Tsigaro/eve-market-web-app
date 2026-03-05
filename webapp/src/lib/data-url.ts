/**
 * Returns the base URL for static data files.
 *
 * Local dev:  NEXT_PUBLIC_DATA_BASE_URL is empty → uses relative /data/ paths
 *             served by Next.js from public/data/
 * Production: NEXT_PUBLIC_DATA_BASE_URL=https://tsigaro.github.io/eve-market-web-app
 *             files are served from the gh-pages branch
 */
const BASE = process.env.NEXT_PUBLIC_DATA_BASE_URL ?? '';

/** URL for a data file, e.g. dataUrl('metadata.json') or dataUrl('10000002-10000043.json') */
export function dataUrl(file: string): string {
  return `${BASE}/data/${file}`;
}

/** URL for metadata.json with cache-busting to bypass browser + CDN cache */
export function metadataUrl(): string {
  return `${BASE}/data/metadata.json?t=${Date.now()}`;
}
