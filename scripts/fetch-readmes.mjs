/**
 * fetch-readmes.mjs
 * ------------------------------------------------------------------
 * Pulls each repo's README from raw.githubusercontent.com (no API rate
 * limit) and writes it into the Astro content collection at
 * src/content/readmes/<slug>.md, so Astro's native Markdown pipeline
 * renders it with syntax highlighting.
 *
 * Relative links and images are rewritten to absolute GitHub URLs so
 * nothing 404s once the README is shown outside the repo.
 *
 * Usage:  node scripts/fetch-readmes.mjs
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'src/data');
const OUT_DIR = resolve(ROOT, 'src/content/readmes');

const CANDIDATES = [
  'README.md',
  'readme.md',
  'Readme.md',
  'README.MD',
  'README.markdown',
  'README.rst',
  'README.txt',
  'README',
];

/** Strip a leading YAML frontmatter block, if the README has one. */
function stripFrontmatter(md) {
  return md.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

/** Turn repo-relative asset/link paths into absolute GitHub URLs. */
function absolutise(md, fullName, branch) {
  const rawBase = `https://raw.githubusercontent.com/${fullName}/${branch}/`;
  const blobBase = `https://github.com/${fullName}/blob/${branch}/`;

  return md
    // HTML <img src="./x"> / <a href="./x">
    .replace(/(<img[^>]+src=["'])(?!https?:|\/\/|data:)(\.?\/?[^"']+)(["'])/gi,
      (_, a, p, c) => `${a}${rawBase}${p.replace(/^\.?\//, '')}${c}`)
    .replace(/(<a[^>]+href=["'])(?!https?:|\/\/|#|mailto:)(\.?\/?[^"']+)(["'])/gi,
      (_, a, p, c) => `${a}${blobBase}${p.replace(/^\.?\//, '')}${c}`)
    // Markdown images ![alt](./x)
    .replace(/(!\[[^\]]*\]\()(?!https?:|\/\/|data:)(\.?\/?[^)\s]+)(\))/g,
      (_, a, p, c) => `${a}${rawBase}${p.replace(/^\.?\//, '')}${c}`)
    // Markdown links [t](./x) — skip anchors and already-absolute links
    .replace(/(\[[^\]]+\]\()(?!https?:|\/\/|#|mailto:)(\.?\/?[^)\s]+)(\))/g,
      (_, a, p, c) => `${a}${blobBase}${p.replace(/^\.?\//, '')}${c}`);
}

/** Human-friendly title from a repo name. */
function titleFrom(name) {
  return name
    .replace(/---/g, ' — ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const repos = JSON.parse(await readFile(resolve(DATA_DIR, 'repos.json'), 'utf8'));
  await mkdir(OUT_DIR, { recursive: true });

  let hits = 0;

  for (const r of repos) {
    const branch = r.defaultBranch || 'main';
    let found = '';

    for (const file of CANDIDATES) {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${r.fullName}/${branch}/${file}`
        );
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 20) {
            found = text;
            break;
          }
        }
      } catch {
        /* try next candidate */
      }
    }

    if (!found) {
      console.log(`  · ${r.name} (no README)`);
      continue;
    }

    const body = absolutise(stripFrontmatter(found), r.fullName, branch);

    const fm = [
      '---',
      `title: ${JSON.stringify(titleFrom(r.name))}`,
      `repo: ${JSON.stringify(r.name)}`,
      `repoUrl: ${JSON.stringify(r.url)}`,
      `language: ${JSON.stringify(r.language || '')}`,
      `branch: ${JSON.stringify(branch)}`,
      `source: ${JSON.stringify(
        `https://github.com/${r.fullName}/blob/${branch}/README.md`
      )}`,
      `bytes: ${found.length}`,
      '---',
      '',
    ].join('\n');

    await writeFile(resolve(OUT_DIR, `${r.name}.md`), fm + body + '\n');
    hits++;
    console.log(`  ✓ ${r.name} (${found.length}b)`);
  }

  console.log(`\n  ✓ ${hits}/${repos.length} READMEs → src/content/readmes/\n`);
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
