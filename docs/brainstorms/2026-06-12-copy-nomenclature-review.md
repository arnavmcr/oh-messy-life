# Copy & Nomenclature Review
**Date:** 2026-06-12  
**Status:** Requirements — ready to implement

## Problem

The site's copy and section naming has drifted toward a "techbro portfolio" register: ALL-CAPS branded section names (THE VOID, THE SIGNAL), version strings (BUILD: 0.1.0_ALPHA), PM-speak ("annotated case studies"), and empty category taglines. The actual voice of the site — as established in the monthly newsletter entries — is personal, lowercase, self-deprecating, and honest. The UI copy doesn't match.

## Voice Direction

Reference: `content/record/*.md` entries. The right register is:
- Lowercase, conversational
- Self-aware without being precious ("unpolished. kept anyway.")
- Specific and grounded — describes what the thing actually is
- Not trying to be branded or cryptic

Good existing examples (keep as-is):
- College tagline: *"Writing from undergrad. Unpolished. Kept anyway."*
- College/travel: *"Places I went. Notes I kept."*

---

## Changes by Surface

### `app/page.tsx` (homepage)

| Element | Current | New |
|---|---|---|
| Eyebrow | `issue zero-two` | `liminality as a filing system` |
| H1 | `a thingi for staying in touch.` | `suspended between idea and object` |
| Blurb | *"hello. this is a small, public version of a monthly newsletter..."* | `writing, a monthly thingi, and projects paused mid-thought — collected here because they wouldn't stay filed away. a holding space for things still in transit.` |
| Chip label | `signal →` | `music →` |

---

### `components/Nav.tsx`

| Label | Current | New |
|---|---|---|
| Music section link | `signal` | `music` |

`labs` stays — it's used naturally on the homepage already.

---

### `app/writing/page.tsx` (THE VOID page)

| Element | Current | New |
|---|---|---|
| H1 | `THE VOID` (text-7xl–9xl, uppercase italic) | `writing` |
| Subhead | `Everything written. Pick a category.` | `everything written, loosely organized. take your time` |

The H1 rendering (font size, uppercase, ink-bleed styling) stays — just the string changes.

---

### `app/record/page.tsx` (THE RECORD page)

| Element | Current | New |
|---|---|---|
| Masthead H1 | `THE RECORD` (all-caps, branded) | `the record` (lowercase) |

Footer note stays: *"Est. December 2023 · Published monthly · Written from Mumbai"*

---

### `app/music/page.tsx` (Signal/Music page)

| Element | Current | New |
|---|---|---|
| Eyebrow label | `THE SIGNAL` | remove entirely (or replace with `music`) |
| Page tagline | `Crate digging, live shows, and everything in between.` | `records, gigs, and opinions nobody asked for` |

The `ACTIVE` stamp and section cards (Library, Gig Archive, T-Shirt Archive) are unchanged.

---

### `lib/copy.ts` — string updates

Live strings that need updating:

| Key | Current | New |
|---|---|---|
| `signal.eyebrow` | `'THE SIGNAL'` | `'music'` (or empty — see above) |
| `signal.tagline` | `'Crate digging, live shows, and everything in between.'` | `'records, gigs, and opinions nobody asked for'` |
| `record.heading` | `'THE RECORD'` | `'the record'` |
| `record.pageTitle` | `'THE RECORD // Oh Messy Life'` | `'the record // oh messy life'` |
| `writing.pageTitle` | `'THE VOID // Oh Messy Life'` | `'writing // oh messy life'` |

Dead strings to remove entirely (not rendered anywhere in the UI):
- `home.scriptoriumTag` (`'SCRIPTORIUM // ARCHIVE_01'`)
- `home.labsHeading` (`'LABS_EXT'`)
- `home.vaultHeading` (`'VAULT_99'`)
- `nav.build` (`'BUILD: 0.1.0_ALPHA'`)
- `nav.allWriting`, `nav.writing`, `nav.record`, `nav.signal`, `nav.labs`, `nav.signalLibrary`, `nav.signalGigArchive`, `nav.signalTshirtArchive` — none of these are used; Nav uses hardcoded strings

---

### `lib/categories.ts` — tagline fills

Three categories currently have empty taglines. New values:

| Category | Current tagline | New tagline |
|---|---|---|
| `essays` | *(empty)* | `things i had to get out of my head` |
| `mba` | *(empty)* | `startups, strategy, doubt — notes from business school` |
| `projects` | *(empty)* | `things built in mumbai. not all of them finished` |

Category icon for `projects` in `app/writing/page.tsx` is currently `code` — consider changing to `build` or `construction` (Material Symbols) for a less pure-developer feel. Not blocking.

---

## What Stays the Same

- Homepage section headings ("the void", "lately" — already lowercase inline)
- Changelog subhead ("every push and pour and patch")
- All college subcategory taglines (already good)
- Music tagline for Library: *"The crate. 8 records, hand-picked."* — fine
- Gig Archive tagline: *"Live shows, documented."* / *"20 years of live music, photographed."* — fine
- URL routes, AGENTS.md codenames, layout structure — untouched

---

## Success Criteria

1. No ALL-CAPS branded section headings visible to visitors (THE VOID, THE SIGNAL as eyebrow)
2. No version strings, underscore notation, or double-slash internal codes visible in the UI
3. All five writing categories have non-empty taglines
4. The three changed page headings (writing, the record, music) read naturally at lowercase
5. Nav "music" label matches the page it links to
