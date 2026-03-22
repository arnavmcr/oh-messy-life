export type AccentColor = 'primary' | 'secondary' | 'tertiary';

export interface PostItNote {
  text: string;
  rotation: string;
}

export interface SubcategoryConfig {
  label: string;
  accentColor?: AccentColor;
  tagline?: string;
  postIts?: PostItNote[];
  tags?: string[];
}

export interface CategoryConfig {
  label: string;
  accentColor?: AccentColor;
  tagline?: string;
  postIts?: PostItNote[];
  subcategories: Record<string, SubcategoryConfig>;
}

export const CATEGORY_MAP: Record<string, CategoryConfig> = {
  college: {
    label: 'College',
    accentColor: 'secondary',
    tagline: 'Writing from undergrad. Unpolished. Kept anyway.',
    postIts: [
      { text: '2014–2019', rotation: '-2deg' },
      { text: 'Bombay → everywhere', rotation: '1.5deg' },
    ],
    subcategories: {
      music: {
        label: 'Music',
        accentColor: 'primary',
        tagline: 'Gig reviews, album essays, scene writing.',
        postIts: [{ text: 'Chordsunited era', rotation: '2deg' }],
        tags: ['album-reviews', 'gig-reviews', 'editorials'],
      },
      travel: {
        label: 'Travel',
        accentColor: 'tertiary',
        tagline: 'Places I went. Notes I kept.',
        postIts: [{ text: 'iPod camera quality', rotation: '-1.5deg' }],
        tags: ['italy', 'meghalaya', 'sikkim', 'india', 'usa'],
      },
      politics: {
        label: 'Politics',
        accentColor: 'primary',
        tagline: 'Undergraduate opinions. Handle with care.',
        postIts: [],
        tags: [],
      },
      economics: {
        label: 'Economics',
        accentColor: 'secondary',
        tagline: 'Papers and analysis from my economics degree.',
        postIts: [{ text: "St. Xavier's College", rotation: '1deg' }],
        tags: ['papers'],
      },
      sports: {
        label: 'Sports',
        accentColor: 'tertiary',
        tagline: '',
        postIts: [],
        tags: [],
      },
      society: {
        label: 'Society',
        accentColor: 'primary',
        tagline: '',
        postIts: [],
        tags: [],
      },
      film: {
        label: 'Film',
        accentColor: 'tertiary',
        tagline: '',
        postIts: [],
        tags: [],
      },
      events: {
        label: 'Events',
        accentColor: 'secondary',
        tagline: '',
        postIts: [],
        tags: [],
      },
    },
  },
  projects: {
    label: 'Projects',
    accentColor: 'primary',
    tagline: '',
    postIts: [],
    subcategories: {},
  },
  mba: {
    label: 'MBA',
    accentColor: 'secondary',
    tagline: '',
    postIts: [],
    subcategories: {},
  },
  essays: {
    label: 'Essays',
    accentColor: 'tertiary',
    tagline: '',
    postIts: [],
    subcategories: {},
  },
  music: {
    label: 'Music',
    accentColor: 'primary',
    tagline: 'Scene writing, gig essays, and culture criticism.',
    postIts: [
      { text: 'After EOD', rotation: '-1.5deg' },
    ],
    subcategories: {},
  },
};
