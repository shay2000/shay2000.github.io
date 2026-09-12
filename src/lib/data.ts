/**
 * Build-time access to the data pulled from GitHub by
 * scripts/fetch-github.mjs. Everything here is static JSON, so the site
 * builds with no network access and no API rate limits.
 */

import profileJson from '../data/profile.json';
import reposJson from '../data/repos.json';

export type LangSlice = { name: string; bytes: number; percent: number };

export type Commit = { sha?: string; message: string; date?: string };

export type Repo = {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  languages: LangSlice[];
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  topics: string[];
  license: string | null;
  isFork: boolean;
  isArchived: boolean;
  createdAt: string;
  pushedAt: string;
  sizeKb: number;
  hasPages: boolean;
  hasWiki: boolean;
  defaultBranch: string;
  featured: boolean;
  commits: Commit[];
};

export type Profile = {
  login: string;
  name: string;
  avatar: string;
  url: string;
  bio: string | null;
  location: string | null;
  blog: string;
  joinedAt: string;
  followers: number;
  following: number;
  publicRepos: number;
  generatedAt: string;
  stats: {
    trackedRepos: number;
    originalRepos: number;
    forkedRepos: number;
    totalStars: number;
    totalForks: number;
    totalCommitsSampled: number;
    activeDays: number;
    distinctLanguages: number;
    firstCommit: string | null;
    latestPush: string;
  };
  topLanguages: LangSlice[];
  dayCounts: Record<string, number>;
  monthCounts: Record<string, number>;
};

export const profile = profileJson as unknown as Profile;
export const repos = reposJson as unknown as Repo[];

/* ------------------------------------------------------------------ *
 * Derived collections
 * ------------------------------------------------------------------ */

/** Original work first, then forks — each sorted by most recent push. */
export const sortedRepos: Repo[] = [...repos].sort((a, b) => {
  if (a.isFork !== b.isFork) return a.isFork ? 1 : -1;
  return b.pushedAt.localeCompare(a.pushedAt);
});

export const originalRepos = sortedRepos.filter((r) => !r.isFork);

export function getRepo(name: string): Repo | undefined {
  return repos.find((r) => r.name === name);
}

/** Repos that carry a language we recognise, biggest first. */
export const reposBySize: Repo[] = [...repos].sort(
  (a, b) => b.sizeKb - a.sizeKb
);

/** Recent commit feed across all repos — the "latest activity" strip.
 *  De-duplicated by message: fork networks repeat the same commit across
 *  several repositories, which makes the feed look broken. */
export const recentCommits: (Commit & { repo: string; repoUrl: string })[] = (() => {
  const all = repos
    .flatMap((r) =>
      r.commits.map((c) => ({ ...c, repo: r.name, repoUrl: r.url }))
    )
    .filter((c) => !!c.date)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const seen = new Set<string>();
  const out: typeof all = [];

  for (const c of all) {
    const key = (c.message || '').toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= 20) break;
  }

  return out;
})();

/* ------------------------------------------------------------------ *
 * Heatmap — build a GitHub-style 53-week calendar from dayCounts
 * ------------------------------------------------------------------ */

export type HeatDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  weekday: number;
  inRange: boolean;
};

function levelFor(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (max <= 4) return count >= 2 ? 3 : 2;
  const r = count / max;
  if (r <= 0.15) return 1;
  if (r <= 0.4) return 2;
  if (r <= 0.7) return 3;
  return 4;
}

/** Trailing 52 weeks + the current partial week, aligned to weeks. */
export function buildHeatmap(dayCounts: Record<string, number>, weeks = 52) {
  const counts = Object.values(dayCounts);
  const max = counts.length ? Math.max(...counts) : 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk back to the most recent Sunday, then back `weeks` more.
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const days: HeatDay[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const count = dayCounts[key] || 0;
    days.push({
      date: key,
      count,
      level: levelFor(count, max),
      weekday: cursor.getDay(),
      inRange: cursor <= today,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Chunk into weeks (columns).
  const cols: HeatDay[][] = [];
  for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));

  // Month labels: the first column where a new month begins.
  const months: { index: number; label: string }[] = [];
  let lastMonth = -1;
  cols.forEach((col, i) => {
    const m = new Date(col[0].date).getMonth();
    if (m !== lastMonth) {
      months.push({
        index: i,
        label: new Date(col[0].date).toLocaleString('en-GB', { month: 'short' }),
      });
      lastMonth = m;
    }
  });

  const total = days.reduce((a, d) => a + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  return { cols, months, days, max, total, activeDays };
}

/** Longest run of consecutive active days, for the stats strip. */
export function longestStreak(dayCounts: Record<string, number>): number {
  const keys = Object.keys(dayCounts)
    .filter((k) => dayCounts[k] > 0)
    .sort();
  if (!keys.length) return 0;

  let best = 1;
  let run = 1;

  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(keys[i - 1]).getTime();
    const cur = new Date(keys[i]).getTime();
    const gap = Math.round((cur - prev) / 86_400_000);
    run = gap === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

/** Busiest month on record. */
export function busiestMonth(monthCounts: Record<string, number>) {
  const entries = Object.entries(monthCounts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return { month: '', count: 0 };
  return { month: entries[0][0], count: entries[0][1] };
}
