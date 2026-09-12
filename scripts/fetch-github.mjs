/**
 * fetch-github.mjs
 * ------------------------------------------------------------------
 * Pulls real data for a GitHub user and writes it to src/data/ as JSON
 * so the site can be built offline and deterministically.
 *
 * Usage:  node scripts/fetch-github.mjs [username]
 *
 * Outputs
 *   src/data/profile.json   – user profile + aggregate stats
 *   src/data/repos.json     – every public repo with language breakdown
 *   src/data/activity.json  – daily commit counts (for the heatmap)
 *   src/data/readmes.json   – raw README markdown per repo
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'src/data');

const USER = process.argv[2] || 'shay2000';
const TOKEN = process.env.GITHUB_TOKEN || '';

const HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'shay2000-portfolio-build',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

/** Fetch JSON with a small retry + rate-limit awareness. */
async function gh(path, { raw = false } = {}) {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: raw ? { ...HEADERS, Accept: 'text/plain' } : HEADERS });
    if (res.status === 404) return null;
    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000;
      const wait = Math.max(1000, Math.min(reset - Date.now(), 8000));
      console.warn(`  rate limited, waiting ${Math.round(wait / 1000)}s…`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return raw ? res.text() : res.json();
  }
  return null;
}

/** Repos that are pure noise in a portfolio context. */
const DENYLIST = new Set(['hello-world']);

/** Hand-written editorial framing for the headline projects. */
const FEATURED = [
  'watt-is-it',
  'PodcastSync-Local-Mac-App',
  'LumaControl',
  'zotero-ai-plugin',
  'flipoff-Aeroplanes',
  'Mac-TreeSpace',
];

async function main() {
  console.log(`\n  Fetching GitHub data for @${USER}${TOKEN ? ' (authenticated)' : ' (anonymous)'}\n`);

  await mkdir(DATA_DIR, { recursive: true });

  const user = await gh(`/users/${USER}`);
  if (!user) throw new Error(`User ${USER} not found`);

  const rawRepos = (await gh(`/users/${USER}/repos?per_page=100&sort=pushed`)) || [];
  console.log(`  ${rawRepos.length} public repositories`);

  const repos = [];

  for (const r of rawRepos) {
    if (DENYLIST.has(r.name)) continue;

    let languages = {};
    let readme = '';
    let commits = [];

    try {
      languages = (await gh(`/repos/${USER}/${r.name}/languages`)) || {};
    } catch (e) {
      console.warn(`  ! languages ${r.name}: ${e.message}`);
    }

    try {
      const readmeRes = await gh(`/repos/${USER}/${r.name}/readme`, { raw: true });
      if (readmeRes) {
        // The raw endpoint returns base64 JSON unless we ask for raw text.
        readme = typeof readmeRes === 'string' && readmeRes.trim().startsWith('{')
          ? Buffer.from(JSON.parse(readmeRes).content || '', 'base64').toString('utf8')
          : readmeRes;
      }
    } catch (e) {
      console.warn(`  ! readme ${r.name}: ${e.message}`);
    }

    try {
      const c = await gh(`/repos/${USER}/${r.name}/commits?per_page=100`);
      if (Array.isArray(c)) {
        commits = c.map((x) => ({
          sha: x.sha?.slice(0, 7),
          message: (x.commit?.message || '').split('\n')[0],
          date: x.commit?.author?.date || x.commit?.committer?.date,
        }));
      }
    } catch (e) {
      console.warn(`  ! commits ${r.name}: ${e.message}`);
    }

    const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
    const langBreakdown = Object.entries(languages)
      .map(([name, bytes]) => ({ name, bytes, percent: +((bytes / totalBytes) * 100).toFixed(2) }))
      .sort((a, b) => b.bytes - a.bytes);

    repos.push({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      homepage: r.homepage || null,
      language: r.language,
      languages: langBreakdown,
      stars: r.stargazers_count,
      forks: r.forks_count,
      watchers: r.watchers_count,
      openIssues: r.open_issues_count,
      topics: r.topics || [],
      license: r.license?.spdx_id || null,
      isFork: r.fork,
      isArchived: r.archived,
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
      sizeKb: r.size,
      hasPages: !!r.has_pages,
      hasWiki: !!r.has_wiki,
      defaultBranch: r.default_branch,
      featured: FEATURED.includes(r.name),
      commits,
      readme,
    });

    process.stdout.write(`  · ${r.name}\n`);
  }

  // ---- aggregate activity ----------------------------------------------
  const dayCounts = {};
  const monthCounts = {};
  let totalCommitsSampled = 0;

  for (const r of repos) {
    for (const c of r.commits) {
      if (!c.date) continue;
      const day = c.date.slice(0, 10);
      const month = c.date.slice(0, 7);
      dayCounts[day] = (dayCounts[day] || 0) + 1;
      monthCounts[month] = (monthCounts[month] || 0) + 1;
      totalCommitsSampled++;
    }
  }

  // ---- language totals across all repos ---------------------------------
  const langTotals = {};
  for (const r of repos) {
    for (const l of r.languages) {
      langTotals[l.name] = (langTotals[l.name] || 0) + l.bytes;
    }
  }
  const langTotalBytes = Object.values(langTotals).reduce((a, b) => a + b, 0) || 1;
  const topLanguages = Object.entries(langTotals)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: +((bytes / langTotalBytes) * 100).toFixed(1),
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const profile = {
    login: user.login,
    name: user.name || user.login,
    avatar: user.avatar_url,
    url: user.html_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    blog: user.blog,
    joinedAt: user.created_at,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    publicGists: user.public_gists,
    generatedAt: new Date().toISOString(),
    stats: {
      trackedRepos: repos.length,
      originalRepos: repos.filter((r) => !r.isFork).length,
      forkedRepos: repos.filter((r) => r.isFork).length,
      totalStars: repos.reduce((a, r) => a + r.stars, 0),
      totalForks: repos.reduce((a, r) => a + r.forks, 0),
      totalCommitsSampled,
      activeDays: Object.keys(dayCounts).length,
      distinctLanguages: Object.keys(langTotals).length,
      firstCommit: Object.values(dayCounts).length
        ? Object.keys(dayCounts).sort()[0]
        : null,
      latestPush: repos.map((r) => r.pushedAt).sort().reverse()[0],
    },
    topLanguages,
    dayCounts,
    monthCounts,
  };

  await writeFile(resolve(DATA_DIR, 'profile.json'), JSON.stringify(profile, null, 2));
  await writeFile(
    resolve(DATA_DIR, 'repos.json'),
    JSON.stringify(repos.map(({ readme, ...rest }) => rest), null, 2)
  );
  await writeFile(
    resolve(DATA_DIR, 'readmes.json'),
    JSON.stringify(Object.fromEntries(repos.map((r) => [r.name, r.readme])), null, 2)
  );

  console.log(`\n  ✓ wrote profile.json, repos.json, readmes.json`);
  console.log(
    `  ${profile.stats.trackedRepos} repos · ${profile.stats.distinctLanguages} languages · ${totalCommitsSampled} commits sampled\n`
  );
}

main().catch((err) => {
  console.error('\n  ✗ fetch failed:', err.message, '\n');
  process.exit(1);
});
