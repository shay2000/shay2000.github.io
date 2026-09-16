import { getCollection } from 'astro:content';
import { getRepo } from './data';

export const directions = [
  { slug: 'flight-manual', name: 'Flight Manual', number: '05', line: 'Small tools. New horizons.', mood: 'Shuttle-era · systematic · optimistic', type: 'Inter / JetBrains Mono', colours: ['#efeee6', '#ee4b2b', '#182a3c', '#e7803c', '#eab95b'], reference: 'NASA — Graphics Standards Manual, 1976', url: 'https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf', rationale: 'The optimism and clarity of Shuttle-era visual communication: strong numbering, flush-left sans-serif typography and warm red on light paper. A navy orbital plate and orange-gold bands add an original poster-like interpretation. No NASA logo or affiliation.', interaction: 'Choose a payload to open a project brief, then explore the engineering notes.' },
  { slug: 'atlas', name: 'Atlas', number: '01', line: 'An index of useful things.', mood: 'Editorial · precise · expansive', type: 'Fraunces / Inter', colours: ['#f5f3ec', '#191919', '#b83b27'], reference: 'Pentagram — editorial design', url: 'https://www.pentagram.com/editorial-design', rationale: 'Publication-scale typography, decisive rules and an asymmetric reading rhythm. The project index behaves like a table of contents, not a wall of cards.', interaction: 'Filter the index by discipline; unfold the thinking behind each build.' },
  { slug: 'studio', name: 'Studio', number: '02', line: 'Small tools. Big personality.', mood: 'Graphic · playful · direct', type: 'Inter, tightly set / JetBrains Mono', colours: ['#193de8', '#e0fc76', '#f5f3ec'], reference: 'Osmo — interaction library', url: 'https://www.osmo.supply/', rationale: 'Expressive scale and tactile interaction, translated into an original cobalt-and-citron poster. A project selector changes the entire stage, rather than sending you through a carousel.', interaction: 'Choose a project to change the artwork, description and destination.' },
  { slug: 'observatory', name: 'Observatory', number: '03', line: 'Follow a signal.', mood: 'Technical · nocturnal · exploratory', type: 'JetBrains Mono / Inter', colours: ['#091719', '#b7f1d4', '#f1bc77'], reference: 'NASA Science — Universe', url: 'https://science.nasa.gov/universe/', rationale: 'The spatial curiosity of a star atlas, without pretending project data is telemetry. An original schematic constellation is paired with a readable project inspector.', interaction: 'Select an orbital marker to inspect a real repository and its technology.' },
  { slug: 'fieldnotes', name: 'Fieldnotes', number: '04', line: 'Made, noticed, written down.', mood: 'Tactile · thoughtful · personal', type: 'Fraunces / JetBrains Mono', colours: ['#eee5d3', '#364f3e', '#a63f26'], reference: 'Are.na — collecting ideas', url: 'https://www.are.na/', rationale: 'A collection that rewards meandering: generous serif type, ruled paper, margin notes and a pasted-in technical drawing. The notebook metaphor organises real writing rather than manufacturing nostalgia.', interaction: 'Switch notebook topics and open the reading notes before visiting an essay.' },
];

export async function getAlternativeContent() {
  const notes = (await getCollection('projects')).sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
  const projects = notes.map(note => {
    const repo = getRepo(note.data.repo);
    if (!repo) throw new Error(`Missing alternative project: ${note.data.repo}`);
    return { name: repo.name, title: ({ 'watt-is-it': 'Watt is it?', 'PodcastSync-Local-Mac-App': 'PodcastSync', 'flipoff-Aeroplanes': 'FlipOff', 'zotero-ai-plugin': 'Zotero AI', 'Mac-TreeSpace': 'TreeSpace' } as Record<string, string>)[repo.name] ?? repo.name, description: note.data.tagline, stack: note.data.stack, category: repo.name === 'flipoff-Aeroplanes' || repo.name === 'zotero-ai-plugin' ? 'Web & research' : 'Mac utilities', href: `/projects/${repo.name}`, fork: repo.isFork };
  });
  const articles = (await getCollection('articles')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return { projects, articles };
}
