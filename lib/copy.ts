// lib/copy.ts
// All identity copy for the site — section names, nav labels, page titles, taglines.
// Edit here to rename anything; leave decorative console/status strings in components.

export const COPY = {

  // ── Navigation ────────────────────────────────────────────────────────────
  nav: {
    writing:            'WRITING',
    record:             'RECORD',
    signal:             'SIGNAL',
    labs:               'LABS',
    allWriting:         'ALL WRITING',
    build:              'BUILD: 0.1.0_ALPHA',
    signalLibrary:      'LIBRARY',
    signalGigArchive:   'GIG ARCHIVE',
    signalTshirtArchive:'T-SHIRT ARCHIVE',
  },

  // ── Homepage ──────────────────────────────────────────────────────────────
  home: {
    eyebrow:          'public archive',
    scriptoriumTag:   'SCRIPTORIUM // ARCHIVE_01',
    labsHeading:      'LABS_EXT',
    labsDescription:  'Projects, interactive experiments, and annotated case studies — in construction.',
    vaultHeading:     'VAULT_99',
  },

  // ── Writing — THE VOID ────────────────────────────────────────────────────
  writing: {
    pageTitle:       'THE VOID // Oh Messy Life',
    pageDescription: 'Writing archive',
  },

  // ── Record — THE RECORD ───────────────────────────────────────────────────
  record: {
    pageTitle:       'THE RECORD // Oh Messy Life',
    pageDescription: 'A monthly journal — issues, observations, and the ongoing mess of being alive.',
    heading:         'THE RECORD',
    footerNote:      'Est. December 2023 · Published monthly · Written from Mumbai',
  },

  // ── Signal / Music — THE SIGNAL ───────────────────────────────────────────
  signal: {
    pageTitle:       'Music — Oh Messy Life',
    pageDescription: 'THE SIGNAL. Crate digging, gigs, and everything in between.',
    eyebrow:         'THE SIGNAL',
    heading:         'MUSIC',
    tagline:         'Crate digging, live shows, and everything in between.',
    library: {
      label:       'THE LIBRARY',
      heading:     'LIBRARY',
      description: 'The crate. 8 records, hand-picked.',
    },
    gigArchive: {
      label:       'THE GIG ARCHIVE',
      heading:     'GIG ARCHIVE',
      description: 'Live shows, documented.',
    },
    tshirtArchive: {
      label:       'THE T-SHIRT ARCHIVE',
      heading:     'T-SHIRT ARCHIVE',
      description: 'Every shirt, every tour.',
    },
  },

} as const;
