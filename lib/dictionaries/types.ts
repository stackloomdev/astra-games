/**
 * Every user-visible string on the site. One object per locale, all required,
 * so a missing translation is a type error rather than an English word leaking
 * into a translated page.
 */
export interface Dictionary {
  meta: {
    title: string;
    tagline: string;
    description: string;
  };
  nav: {
    works: string;
    how: string;
    about: string;
    language: string;
    skipToContent: string;
  };
  hero: {
    liveBadge: string;
    staleBadge: string;
    /** Two display lines; the second carries the brand gradient. */
    headline: [string, string];
    lead: string;
    browse: string;
    submit: string;
    statWorks: string;
    statAuthors: string;
    statPlayable: string;
    lastChecked: string;
  };
  marquee: string[];
  works: {
    eyebrow: string;
    heading: [string, string];
    lead: string;
    upstreamReadme: string;
    search: string;
    emptyTitle: string;
    emptyBody: string;
    reset: string;
    categories: Record<'all' | 'game' | 'experiment' | 'app' | 'tool' | 'website' | 'other', string>;
  };
  card: {
    playable: string;
    open: string;
    viewSource: string;
    by: string;
    screenshotAlt: string;
    details: string;
  };
  criteria: {
    eyebrow: string;
    heading: [string, string];
    lead: string;
    rows: { term: string; detail: string }[];
    note: string;
  };
  how: {
    eyebrow: string;
    heading: [string, string];
    lead: string;
    cta: string;
    steps: { title: string; body: string }[];
  };
  cta: {
    heading: [string, string];
    lead: string;
    submit: string;
    github: string;
  };
  detail: {
    back: string;
    play: string;
    source: string;
    repository: string;
    author: string;
    category: string;
    listedUnder: string;
    notFound: string;
    notFoundBody: string;
    upstreamNote: string;
    otherWorks: string;
    metadata: string;
  };
  footer: {
    disclaimer: string;
    license: string;
    catalogue: string;
    participate: string;
    project: string;
    links: {
      works: string;
      how: string;
      upstream: string;
      submit: string;
      brokenLink: string;
      contributing: string;
      mainRepo: string;
      siteSource: string;
    };
  };
}
