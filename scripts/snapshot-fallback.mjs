/**
 * Refreshes the cold-start fallback snapshots from the live upstream lists.
 *
 * These are only read when the server starts with no cache and cannot reach
 * GitHub; the site is otherwise always live. Only the primary language and
 * Chinese carry one — a snapshot is a copy of one language's catalogue and can
 * never stand in for another.
 *
 *   npm run snapshot
 *
 * Note that raw.githubusercontent.com is CDN-cached for a few minutes, so a run
 * immediately after an upstream merge can capture the previous revision. The
 * printed revision lets you check what you actually got.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { REPOSITORY, parseCatalogMarkdown, rawUrlFor, readmeUrlFor } from '../lib/catalog.js';

const TARGETS = [
  ['README.md', 'lib/catalog-fallback.en.json'],
  ['README.zh-CN.md', 'lib/catalog-fallback.zh-CN.json'],
];

for (const [readmePath, out] of TARGETS) {
  const response = await fetch(rawUrlFor(readmePath), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${readmePath}: HTTP ${response.status}`);
  const markdown = await response.text();
  const works = parseCatalogMarkdown(markdown, { readmePath });
  const bytes = Buffer.from(markdown);
  const revision = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  const capturedAt = new Date().toISOString();

  writeFileSync(
    out,
    `${JSON.stringify(
      {
        works,
        source: {
          repository: REPOSITORY,
          url: readmeUrlFor(readmePath),
          readmePath,
          revision,
          checkedAt: capturedAt,
          lastSuccessfulAt: capturedAt,
          stale: true,
          status: 'fallback',
        },
      },
      null,
      2,
    )}\n`,
  );
  console.log(`${out}  ${String(works.length).padStart(2)} works  rev ${revision.slice(0, 8)}`);
}
