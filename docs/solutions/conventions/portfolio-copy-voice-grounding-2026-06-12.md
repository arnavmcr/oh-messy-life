---
title: "Site Copy Voice and Nomenclature Conventions"
date: 2026-06-12
category: docs/solutions/conventions
module: oh-messy-life
problem_type: developer_experience
component: documentation
severity: medium
root_cause: inadequate_documentation
resolution_type: workflow_improvement
applies_when:
  - "Writing any user-facing copy: headings, taglines, blurbs, nav labels, eyebrows"
  - "Adding new sections, pages, or categories to the site"
  - "Reviewing lib/copy.ts or lib/categories.ts after a content expansion"
  - "Before any public share — audit all copy surfaces against these rules"
related_components:
  - tooling
tags:
  - copy
  - voice
  - personal-portfolio
  - homepage
  - spiral-mcp
  - positioning
  - naming-conventions
  - content-strategy
---

# Site Copy Voice and Nomenclature Conventions

## Context

The site accumulated copy that read as "techbro portfolio" — theatrical ALL-CAPS section branding (THE VOID, THE SIGNAL, THE RECORD), version strings (BUILD: 0.1.0_ALPHA), PM-speak ("annotated case studies"), a homepage intro that framed the whole site as "a public version of a monthly newsletter" (backwards — the newsletter is one of four sections), and empty category taglines. The UI copy had drifted into a register that fought the site's visual aesthetic (distressed-paper, collage, tactile, personal) and contradicted the actual voice established in the content itself.

The site's voice reference is `content/record/*.md` — the monthly newsletter entries. That voice is: lowercase, conversational, self-aware without being precious, honest about what things are. The problem was the absence of a documented convention forcing UI copy to match.

## Guidance

### Rule 1: Internal codenames never appear as page copy

Section codenames in `AGENTS.md` (`THE VOID`, `THE SIGNAL`, `THE RECORD`, `THE MANUSCRIPT`, `THE NEXUS`) are developer shorthand. They are never the literal string rendered on a page.

| Page | Codename (internal only) | Actual heading |
|---|---|---|
| `/writing` | THE VOID | `writing` |
| `/record` | THE RECORD | `the record` |
| `/music` | THE SIGNAL | `music` (heading), no eyebrow |
| `/writing/[slug]` | THE MANUSCRIPT | not shown |

### Rule 2: No version strings, build numbers, or underscore notation in the UI

`BUILD: 0.1.0_ALPHA`, `LABS_EXT`, `VAULT_99`, `SCRIPTORIUM // ARCHIVE_01` — all removed. These signal "software product" when the site is a personal archive. If a string isn't rendered anywhere, delete it from `lib/copy.ts`.

### Rule 3: The homepage describes what the site IS, not what one section does

**Wrong framing:** "this is a small, public version of a monthly newsletter" — frames the whole site by the Record section, which is one of four.

**Correct framing:** describe the full archive — writing, monthly thing, projects mid-thought. The newsletter is part of that, not the container for all of it.

```
Before:
  eyebrow: issue zero-two
  H1: a thingi for staying in touch.
  blurb: hello. this is a small, public version of a monthly newsletter
         i write to stay connected with my friends. reply or don't, at your own pace.

After:
  eyebrow: liminality as a filing system
  H1: suspended between idea and object
  blurb: writing, a monthly thingi, and projects paused mid-thought —
         collected here because they wouldn't stay filed away.
         a holding space for things still in transit.
```

### Rule 4: Don't imply interactivity that doesn't exist

"reply or don't, at your own pace" is newsletter CTA language. There is no reply mechanism on the site. Remove copy that implies feedback loops or response capabilities that aren't implemented.

### Rule 5: Nav labels are plain English, lowercase

`signal` is a tech metaphor for a music archive. Clever in the wrong direction. Nav labels describe what the section actually is.

```
signal → music
labs   → labs (already natural; fine as-is)
```

### Rule 6: All category taglines must be filled — no empty strings

Empty taglines signal incompleteness. Every entry in `lib/categories.ts` needs a tagline. Voice register: lowercase, first-person when natural, specific, slightly self-deprecating, honest about what the writing actually is.

**Voice reference — existing taglines that set the bar:**
- `"Writing from undergrad. Unpolished. Kept anyway."`
- `"Places I went. Notes I kept."`

**Taglines added:**
```
essays:   things i had to get out of my head.
mba:      startups, strategy, doubt — notes from business school.
projects: things built in mumbai. not all of them finished.
```

### Rule 7: Pressure-test homepage copy from first principles

Before accepting any homepage copy, check:
1. Does the eyebrow set the conceptual register of the *whole* site, or just one section?
2. Does the H1 describe what the site is to a first-time visitor?
3. Does the blurb imply any capability (reply, interact, subscribe) that isn't wired up?
4. Does any copy use author-facing metadata (issue numbers, version numbers) that means nothing to a visitor?

## Why This Matters

The site's aesthetic is distressed-paper, collage, handmade — tactile and personal. Copy that reads as SaaS product or tech portfolio creates a register mismatch that undermines the entire visual direction. The actual content (newsletter entries) has a distinct, established voice. UI copy that contradicts it makes the site feel incoherent.

## When to Apply

- Any time a new section, page, or category is added and needs a heading, eyebrow, tagline, or blurb
- When copy feels "too polished" or "too product-y" when read aloud
- Reviewing `lib/copy.ts` or `lib/categories.ts` after content expansions
- Before sharing the site URL publicly

## Examples

### Full before/after reference

| Surface | Before | After |
|---|---|---|
| Homepage eyebrow | `issue zero-two` | `liminality as a filing system` |
| Homepage H1 | `a thingi for staying in touch.` | `suspended between idea and object` |
| Homepage blurb | `this is a small, public version of a monthly newsletter. reply or don't, at your own pace.` | `writing, a monthly thingi, and projects paused mid-thought — collected here because they wouldn't stay filed away. a holding space for things still in transit.` |
| Writing page H1 | `THE VOID` (with `uppercase` CSS class) | `writing` (no uppercase class) |
| Music eyebrow | `THE SIGNAL` | removed |
| Music tagline | `Crate digging, live shows, and everything in between.` | `records, gigs, and opinions nobody asked for.` |
| Record masthead | `THE RECORD` | `the record` |
| Nav: music link | `signal` | `music` |
| Nav: build string | `BUILD: 0.1.0_ALPHA` | removed |
| essays tagline | *(empty)* | `things i had to get out of my head.` |
| mba tagline | *(empty)* | `startups, strategy, doubt — notes from business school.` |
| projects tagline | *(empty)* | `things built in mumbai. not all of them finished.` |

### Process for writing new copy

When new surfaces need copy:

1. Read 2–3 entries in `content/record/*.md` to recalibrate the voice register before writing anything.
2. Use Spiral MCP (`spiral_generate_writing`) with the `Monthly newsletter/stream of consciousness` style (style_id: `f4df91c2-5661-47ef-bd31-bc2207a1d6c6`, trained on Arnav's own writing samples). This produces the closest match to the established voice.
3. Iterate with directional constraints: no tech metaphors, no list-like summaries, specific over generic, avoid "trying too hard to be poetic."
4. Pressure-test against Rule 7 before accepting.

**Note on Spiral:** first-round generations often land slightly cheesy or listy. Multiple rounds with tighter constraints are expected. The liminality/in-betweenness angle for the homepage took three generation rounds to land without being overwrought.

## Related

- `lib/copy.ts` — canonical source of all UI strings; dead strings should be deleted, not commented
- `lib/categories.ts` — category taglines
- `app/page.tsx` — homepage copy (inline, not via COPY object)
- `content/record/*.md` — voice reference; read before writing new copy
- `docs/brainstorms/2026-06-12-copy-nomenclature-review.md` — full brainstorm and requirements doc for this change
