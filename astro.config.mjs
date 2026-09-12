// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Update `site` to the real domain before deploying — it feeds canonical
// URLs, the sitemap, and the RSS feed.
export const SITE = 'https://shay2000.github.io';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  integrations: [sitemap()],

  markdown: {
    // Dual-theme code blocks: Shiki emits both palettes, CSS picks one.
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      wrap: true,
      defaultColor: false,
    },
    remarkPlugins: [],
    rehypePlugins: [],
  },

  build: {
    inlineStylesheets: 'auto',
  },
});
