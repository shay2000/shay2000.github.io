/**
 * Site-wide configuration and shared helpers.
 * Edit SITE to point at the real domain before deploying.
 */

export const SITE = {
  url: 'https://shay2000.github.io',
  title: 'shay2000',
  tagline: 'Small tools, built carefully.',
  description:
    'Open-source builds, field notes and write-ups from shay2000 — macOS menu-bar utilities, self-hosted services, and the occasional experiment.',
  author: 'shay2000',
  github: 'https://github.com/shay2000',
  /** Support link — appears in the hero, footer, and about page. */
  coffee: 'https://buymeacoffee.com/shay2k',
  locale: 'en-GB',
};

export const NAV = [
  { href: '/', label: 'Index' },
  { href: '/projects', label: 'Builds' },
  { href: '/writing', label: 'Writing' },
  { href: '/tags', label: 'Tags' },
  { href: '/about', label: 'About' },
];

/* ------------------------------------------------------------------ *
 * GitHub's official language colours. Anything missing falls back to
 * a neutral tone so the language bar never breaks.
 * ------------------------------------------------------------------ */
export const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Swift: '#f05138',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Sass: '#a53b70',
  Shell: '#89e051',
  Bash: '#89e051',
  PowerShell: '#012456',
  Batchfile: '#c1f12e',
  NSIS: '#9c6c3c',
  Fluent: '#ff9e1b',
  Rust: '#dea584',
  Go: '#00add8',
  Ruby: '#701516',
  Java: '#b07219',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  'Objective-C': '#438eff',
  'Objective-C++': '#6866fb',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Lua: '#000080',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  CMake: '#da3434',
  Zig: '#ec915c',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  PHP: '#4f5d95',
  R: '#198ce7',
  Julia: '#a270ba',
  Nix: '#7e7eff',
  RichTextFormat: '#2b2b2b',
  'Jupyter Notebook': '#da5b0b',
  Astro: '#ff5a03',
  MDX: '#fcb32c',
  Markdown: '#083fa1',
  TeX: '#3d6117',
  Assembly: '#6e4c13',
  Perl: '#0298c3',
  Scala: '#c22d40',
  Groovy: '#4298b8',
  'F#': '#b845fc',
  Visual: '#e34c26',
  Basic: '#6c2c0f',
  Pascal: '#e3f171',
  MATLAB: '#e16737',
  'Vim Script': '#199f4b',
  Emacs: '#c065db',
  AppleScript: '#101f1f',
};

export function langColor(name?: string | null): string {
  if (!name) return 'var(--ink-faint)';
  return LANG_COLORS[name] || '#8a7f70';
}

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

const dateFmt = new Intl.DateTimeFormat(SITE.locale, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDate(d: Date | string): string {
  return dateFmt.format(typeof d === 'string' ? new Date(d) : d);
}

export function isoDate(d: Date | string): string {
  return (typeof d === 'string' ? new Date(d) : d).toISOString();
}

/** "3 days ago" — used for last-push timestamps. */
export function relativeTime(d: Date | string): string {
  const then = (typeof d === 'string' ? new Date(d) : d).getTime();
  const diff = Date.now() - then;
  const day = 86_400_000;
  const days = Math.floor(diff / day);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365.25);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/** Rough reading time from raw markdown. */
export function readingTime(body = ''): number {
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Language/tech names whose slug would otherwise be ambiguous or ugly. */
const SLUG_OVERRIDES: Record<string, string> = {
  'c#': 'csharp',
  'c++': 'cpp',
  'objective-c': 'objective-c',
  'objective-c++': 'objective-cpp',
  'f#': 'fsharp',
  'visual basic .net': 'vbnet',
  '.net': 'dotnet',
  'node.js': 'nodejs',
  'next.js': 'nextjs',
  'vue.js': 'vuejs',
  'ci/cd': 'ci-cd',
  // GitHub topics are freeform, so the same idea arrives spelled several ways.
  // These collapse the near-duplicates onto one canonical slug.
  'menubar-app': 'menu-bar-app',
  // The article frontmatter writes this with a space, the GitHub topics write
  // it hyphenated — both are the same idea, so they share one page.
  'menu bar': 'menu-bar-app',
  'menu-bar': 'menu-bar-app',
  'displays': 'display',
  'xdr-display': 'xdr',
};

/**
 * Preferred display name for a canonical slug. The slug is what the URL uses;
 * this is what the reader sees. Keeps casing and punctuation that the slug
 * strips (e.g. `C#`, `macOS`, `SwiftUI`).
 */
const TAG_NAMES: Record<string, string> = {
  'csharp': 'C#',
  'cpp': 'C++',
  'fsharp': 'F#',
  'vbnet': 'Visual Basic .NET',
  'dotnet': '.NET',
  'nodejs': 'Node.js',
  'nextjs': 'Next.js',
  'vuejs': 'Vue.js',
  'ci-cd': 'CI/CD',
  'macos': 'macOS',
  'swiftui': 'SwiftUI',
  'xdr': 'XDR',
  // GitHub-topic slugs that would otherwise render as lowercase run-together
  // words, or depend on which spelling a repo happened to use first.
  'menu-bar-app': 'Menu bar',
  'monitorcontrol': 'MonitorControl',
  'display': 'Displays',
  'brightness': 'Brightness',
  'charging': 'Charging',
};

/** Canonical display name for a tag, falling back to the raw string. */
export function tagName(tag: string): string {
  return TAG_NAMES[tagSlug(tag)] ?? tag;
}

/** Turn a tag into a URL-safe slug. */
export function tagSlug(tag: string): string {
  const key = tag.toLowerCase().trim();
  if (SLUG_OVERRIDES[key]) return SLUG_OVERRIDES[key];
  return key
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Display name for a slug (best effort). */
export function slugToTitle(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Zero-padded index for editorial numbering. */
export function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/** Compact number formatting: 1240 -> 1.2k */
export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
