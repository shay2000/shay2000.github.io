/**
 * Builds the search index used by the ⌘K command palette.
 * Cached for the duration of the build so every page doesn't rebuild it.
 */

import { getCollection } from 'astro:content';
import { repos, profile } from './data';
import { tagSlug } from './site';

export type SearchItem = {
  title: string;
  subtitle: string;
  href: string;
  kind: 'build' | 'writing' | 'tag' | 'page';
  meta?: string;
};

let cache: SearchItem[] | null = null;

export async function getSearchIndex(): Promise<SearchItem[]> {
  if (cache) return cache;

  const items: SearchItem[] = [];

  // Static pages
  items.push(
    { title: 'Index', subtitle: 'Home', href: '/', kind: 'page' },
    { title: 'Builds', subtitle: 'All open-source repositories', href: '/projects', kind: 'page' },
    { title: 'Writing', subtitle: 'Articles and field notes', href: '/writing', kind: 'page' },
    { title: 'Tags', subtitle: 'Browse by topic', href: '/tags', kind: 'page' },
    { title: 'About', subtitle: 'Background and setup', href: '/about', kind: 'page' }
  );

  // Projects (real GitHub data)
  for (const r of repos) {
    items.push({
      title: r.name,
      subtitle: r.description || 'Repository',
      href: `/projects/${r.name}`,
      kind: 'build',
      meta: [r.language, r.isFork ? 'fork' : null].filter(Boolean).join(' · '),
    });
  }

  // Articles
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  for (const a of articles) {
    items.push({
      title: a.data.title,
      subtitle: a.data.description,
      href: `/writing/${a.id}`,
      kind: 'writing',
      meta: a.data.tags.slice(0, 2).join(' · '),
    });
  }

  // Tags — derived from articles and project languages
  const tagSet = new Set<string>();
  for (const a of articles) for (const t of a.data.tags) tagSet.add(t);
  for (const r of repos) {
    if (r.language) tagSet.add(r.language);
    for (const t of r.topics) tagSet.add(t);
  }
  for (const t of [...tagSet].sort()) {
    items.push({
      title: t,
      subtitle: 'Tag',
      href: `/tags/${tagSlug(t)}`,
      kind: 'tag',
    });
  }

  // A couple of useful external destinations
  items.push({
    title: `@${profile.login} on GitHub`,
    subtitle: 'Opens github.com',
    href: profile.url,
    kind: 'page',
    meta: 'external',
  });

  cache = items;
  return items;
}
