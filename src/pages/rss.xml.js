import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site';

export async function GET(context) {
  const articles = (await getCollection('articles', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    title: `${SITE.title} — writing`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: false,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.date,
      link: `/writing/${a.id}/`,
      categories: a.data.tags,
      author: SITE.author,
    })),
    customData: `<language>en-gb</language><copyright>© ${new Date().getFullYear()} ${SITE.author}</copyright>`,
  });
}
