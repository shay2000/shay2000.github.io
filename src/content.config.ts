import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ------------------------------------------------------------------ *
 * Articles — long-form writing. Markdown files in src/content/articles
 * ------------------------------------------------------------------ */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Pinned articles float to the top of the index. */
    featured: z.boolean().default(false),
    /** Hide from listings while keeping the URL alive. */
    draft: z.boolean().default(false),
    /** Optional emoji/glyph used as the card mark. */
    glyph: z.string().default('◆'),
    /** Optional cover gradient key. */
    tone: z.enum(['ember', 'moss', 'iris', 'sky', 'sand']).default('ember'),
    lang: z.string().default('en'),
  }),
});

/* ------------------------------------------------------------------ *
 * Project notes — hand-written context for a repo, keyed by repo name.
 * Falls back to the README when no note exists.
 * ------------------------------------------------------------------ */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    /** Must match a `name` in src/data/repos.json */
    repo: z.string(),
    tagline: z.string(),
    /** Why it exists / what was interesting about building it. */
    status: z.enum(['active', 'maintained', 'experimental', 'archived']).default('active'),
    year: z.string().optional(),
    stack: z.array(z.string()).default([]),
    highlights: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .default([]),
    /** Manual override for ordering on the home page. */
    order: z.number().default(100),
  }),
});

/* ------------------------------------------------------------------ *
 * READMEs — auto-generated from GitHub by scripts/fetch-readmes.mjs.
 * Do not edit by hand; re-run the script instead.
 * ------------------------------------------------------------------ */
const readmes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/readmes' }),
  schema: z.object({
    title: z.string(),
    repo: z.string(),
    repoUrl: z.string(),
    language: z.string().default(''),
    branch: z.string().default('main'),
    source: z.string(),
    bytes: z.number().default(0),
  }),
});

export const collections = { articles, projects, readmes };
