// lib/copy.ts
// All identity copy for the site — section names, nav labels, page titles, taglines.
// Edit here to rename anything; leave decorative console/status strings in components.

export const COPY = {

  // ── Homepage graph hints ──────────────────────────────────────────────────
  home: {
    graph: {
      idle:       'hover to explore',
      idleMobile: 'tap to explore',
      idleHint:   'nodes are articles and journal entries',
      activeHint: 'click to open',
    },
  },

  // ── Writing ───────────────────────────────────────────────────────────────
  writing: {
    entriesLabel: 'entries',
    emptyState:   'nothing here yet.',
  },

  // ── Article — THE MANUSCRIPT ──────────────────────────────────────────────
  article: {
    dateLabel:       'published',
    taggedLabel:     'tagged',
  },

  // ── Record ────────────────────────────────────────────────────────────────
  record: {
    pageTitle:       'the record // oh messy life',
    pageDescription: 'A monthly journal — issues, observations, and the ongoing mess of being alive.',
    footerNote:      'Est. December 2023 · Published monthly · Written from Mumbai',
  },

  // ── Music ─────────────────────────────────────────────────────────────────
  signal: {
    pageTitle:       'music — oh messy life',
    pageDescription: 'records, gigs, and opinions nobody asked for.',
    heading:         'MUSIC',
    tagline:         'records, gigs, and opinions nobody asked for.',
    library: {
      label:       'THE LIBRARY',
      heading:     'LIBRARY',
      description: 'The crate. 8 records, hand-picked.',
    },
    gigArchive: {
      label:       'THE GIG ARCHIVE',
      heading:     'GIG ARCHIVE',
      description: 'Live shows, documented.',
      tagline:     '20 years of live music, photographed.',
    },
    tshirtArchive: {
      label:       'THE T-SHIRT ARCHIVE',
      heading:     'T-SHIRT ARCHIVE',
      description: 'Every shirt, every tour.',
    },
  },

} as const;
