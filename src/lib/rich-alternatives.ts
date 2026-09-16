import { getCollection } from 'astro:content';
import { profile, getRepo, repos, recentCommits, originalRepos } from './data';

/** Display-only sanitising: source content, URLs and identifiers remain intact. */
export const plain = (text = '') => text.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '').trim();
export const opening = (body = '') => plain(body.trim().split(/\n\s*\n/).find(p => !p.startsWith('#') && !p.startsWith('```')) ?? '');
export const stamp = (date: string | Date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const snapshotDate = stamp(profile.generatedAt);
export const latest = [...repos].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))[0];
export const commits = recentCommits.slice(0, 6);

// Freeze the calendar to the data capture, not the date the site is built.
const end = new Date(`${profile.generatedAt.slice(0, 10)}T00:00:00Z`);
const start = new Date(end.getTime() - 363 * 86400000);
export const calendar = Array.from({ length: 364 }, (_, i) => {
  const date = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
  return { date, count: profile.dayCounts[date] ?? 0 };
});
export const period = `${stamp(start)} – ${stamp(end)}`;
export const calendarTotal = calendar.reduce((sum, d) => sum + d.count, 0);
export const calendarMax = Math.max(1, ...calendar.map(d => d.count));
export const months = Object.entries(calendar.reduce((out, d) => {
  const key = d.date.slice(0, 7); out[key] = (out[key] ?? 0) + d.count; return out;
}, {} as Record<string, number>));

export async function richContent() {
  const notes = (await getCollection('projects')).sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
  const titles: Record<string, string> = { 'watt-is-it': 'Watt is it?', 'PodcastSync-Local-Mac-App': 'PodcastSync', 'flipoff-Aeroplanes': 'FlipOff', 'zotero-ai-plugin': 'Zotero AI', 'Mac-TreeSpace': 'TreeSpace' };
  const projects = notes.map(note => {
    const repo = getRepo(note.data.repo);
    if (!repo) throw new Error(`Missing project ${note.data.repo}`);
    return { ...repo, title: titles[repo.name] ?? repo.name, tagline: plain(note.data.tagline), excerpt: opening(note.body), stack: note.data.stack, highlights: note.data.highlights, href: `/projects/${repo.name}` };
  });
  // Keep every build shown on the original homepage, plus the curated fork.
  const homeBuilds = [...repos.filter(r => r.featured && !r.isFork), ...originalRepos.filter(r => !r.featured)].slice(0, 6);
  const readmes = await getCollection('readmes');
  for (const repo of homeBuilds.filter(r => !projects.some(p => p.name === r.name))) {
    const readme = readmes.find(r => r.data.repo === repo.name);
    const paragraph = readme?.body?.split(/\n\s*\n/).find(p => /^[A-Za-z]/.test(p.trim()));
    const caution = repo.name === 'METAR-Translator' ? ' Simulation and hobby use only; not for real-world aviation or weather decisions.' : '';
    projects.push({ ...repo, title: readme?.data.title ?? repo.name, tagline: plain(repo.description ?? ''), excerpt: plain(paragraph ?? '') + caution, stack: repo.languages.slice(0, 3).map(l => l.name), highlights: [{ label: 'Repository', value: repo.isFork ? 'Fork' : 'Original work' }, { label: 'Primary language', value: repo.language ?? 'Not recorded' }], href: `/projects/${repo.name}` });
  }
  const articles = (await getCollection('articles', ({ data }) => !data.draft)).sort((a,b) => b.data.date.valueOf() - a.data.date.valueOf()).map(a => ({ ...a, excerpt: opening(a.body) }));
  return { projects, articles };
}
