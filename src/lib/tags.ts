/**
 * Tag index built from three sources: article frontmatter, repository
 * primary languages, and repository topics. Everything is normalised to
 * a slug so /tags/csharp and a hand-written "C#" tag land together.
 */

import { getCollection } from 'astro:content';
import { repos } from './data';
import { tagName, tagSlug } from './site';

export type TagInfo = {
  slug: string;
  name: string;
  articles: { id: string; title: string; date: Date; description: string; glyph: string; tone: string }[];
  projects: { name: string; description: string | null; language: string | null }[];
  count: number;
};

let cache: TagInfo[] | null = null;

export async function getAllTags(): Promise<TagInfo[]> {
  if (cache) return cache;

  const map = new Map<string, TagInfo>();

  const ensure = (name: string): TagInfo => {
    const slug = tagSlug(name);
    if (!map.has(slug)) {
      // The display name is normalised too, so a tag that arrives as
      // `menubar-app` from one repo and `menu-bar-app` from another reads the
      // same on both pages instead of depending on iteration order.
      map.set(slug, { slug, name: tagName(name), articles: [], projects: [], count: 0 });
    }
    return map.get(slug)!;
  };

  // --- articles ---
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  for (const a of articles) {
    for (const t of a.data.tags) {
      const info = ensure(t);
      info.articles.push({
        id: a.id,
        title: a.data.title,
        date: a.data.date,
        description: a.data.description,
        glyph: a.data.glyph,
        tone: a.data.tone,
      });
    }
  }

  // --- repositories: primary language + topics ---
  for (const r of repos) {
    if (r.language) ensure(r.language).projects.push({
      name: r.name,
      description: r.description,
      language: r.language,
    });
    for (const t of r.topics) ensure(t).projects.push({
      name: r.name,
      description: r.description,
      language: r.language,
    });
  }

  const list = [...map.values()]
    .map((t) => {
      t.articles.sort((a, b) => b.date.getTime() - a.date.getTime());

      // A repo can reach a tag twice — once as its primary language and once as
      // a topic (e.g. `Swift` + `swift`). Collapse those to a single entry.
      const seenRepo = new Set<string>();
      t.projects = t.projects
        .filter((p) => {
          if (seenRepo.has(p.name)) return false;
          seenRepo.add(p.name);
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      t.count = t.articles.length * 2 + t.projects.length;
      return t;
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  cache = list;
  return list;
}

export async function getTag(slug: string): Promise<TagInfo | undefined> {
  return (await getAllTags()).find((t) => t.slug === slug);
}
