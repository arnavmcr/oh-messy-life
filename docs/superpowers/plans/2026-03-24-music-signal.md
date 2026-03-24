# THE SIGNAL — Music Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the SIGNAL music section from a greyed-out stub to a real nav link with dropdown and a barebones landing page at `/music`.

**Architecture:** `app/music/page.tsx` is a new static Server Component — Next.js serves it at `/music` before the existing rewrite fires (afterFiles priority), so the rewrite in `next.config.ts` requires no changes. `components/Nav.tsx` gains a second hover dropdown (independent state vars) mirroring the WRITING pattern exactly.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4 (tokens in `app/globals.css`), React 19

---

## Files

| Action | File | What it does |
|---|---|---|
| Modify | `components/Nav.tsx` | Remove SIGNAL from comingSoon, add desktop dropdown + mobile link |
| Create | `app/music/page.tsx` | THE SIGNAL landing page — metadata strip, header, 3 section cards |

`next.config.ts` — **no changes**.

---

## Task 1: Update Nav for SIGNAL

**Files:**
- Modify: `components/Nav.tsx`

### Step 1: Remove SIGNAL from the comingSoon array

In `components/Nav.tsx`, find the `comingSoon` array (line ~14). Remove the SIGNAL entry. LABS stays.

Before:
```ts
const comingSoon = [
  { href: '/projects', label: 'LABS' },
  { href: '/music', label: 'SIGNAL' },
];
```

After:
```ts
const comingSoon = [
  { href: '/projects', label: 'LABS' },
];
```

- [ ] Make this change.

### Step 2: Add SIGNAL dropdown state vars

Inside the `Nav` component function, after the existing `closeTimer` ref (line ~22), add:

```ts
const [signalDropdownOpen, setSignalDropdownOpen] = useState(false);
const signalCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] Make this change.

### Step 3: Update the useEffect cleanup

The existing cleanup only clears `closeTimer`. Add `signalCloseTimer` cleanup:

Before:
```ts
useEffect(() => {
  return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
}, []);
```

After:
```ts
useEffect(() => {
  return () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (signalCloseTimer.current) clearTimeout(signalCloseTimer.current);
  };
}, []);
```

- [ ] Make this change.

### Step 4: Add SIGNAL to the desktop nav

In the desktop nav `<div className="hidden md:flex ...">`, after the `<Link href="/record">RECORD</Link>` element (line ~87) and before the `comingSoon.map(...)` block, add the SIGNAL dropdown:

```tsx
{/* SIGNAL with dropdown */}
<div
  className="relative"
  onMouseEnter={() => {
    if (signalCloseTimer.current) clearTimeout(signalCloseTimer.current);
    setSignalDropdownOpen(true);
  }}
  onMouseLeave={() => {
    signalCloseTimer.current = setTimeout(() => setSignalDropdownOpen(false), 150);
  }}
>
  <Link href="/music" className="hover:text-primary transition-colors">
    SIGNAL
  </Link>
  {signalDropdownOpen && (
    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 min-w-[200px] z-50 shadow-lg">
      <a
        href="/music/index.html"
        className="block px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:text-tertiary hover:bg-tertiary/5 transition-colors border-l-2 border-tertiary"
      >
        LIBRARY
      </a>
      <span className="block px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold opacity-30 cursor-not-allowed pointer-events-none">
        GIG ARCHIVE
      </span>
      <span className="block px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold opacity-30 cursor-not-allowed pointer-events-none">
        T-SHIRT ARCHIVE
      </span>
    </div>
  )}
</div>
```

- [ ] Make this change.

### Step 5: Add SIGNAL to the mobile nav

In the mobile nav `<div className="md:hidden ...">`, after the `<Link href="/record">RECORD</Link>` element (line ~104), add:

```tsx
<Link href="/music" className="font-mono text-[10px] tracking-widest uppercase font-bold hover:text-primary transition-colors">
  SIGNAL
</Link>
```

- [ ] Make this change.

### Step 6: Verify TypeScript compiles

```bash
cd "Portfolio: Oh Messy life" # adjust to your path
npx tsc --noEmit
```

Expected: no errors. If you see errors about `signalDropdownOpen` or `signalCloseTimer`, verify the state vars are inside the component function (not at module scope).

- [ ] Run and confirm no errors.

### Step 7: Commit

```bash
git add components/Nav.tsx
git commit -m "feat(nav): promote SIGNAL to real link with dropdown"
```

- [ ] Commit.

---

## Task 2: Create THE SIGNAL Landing Page

**Files:**
- Create: `app/music/page.tsx`

### Step 1: Create the file

Create `app/music/page.tsx` with this content:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music — Oh Messy Life',
  description: 'THE SIGNAL. Crate digging, gigs, and everything in between.',
};

export default function MusicPage() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-16">

      {/* Metadata strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
          THE SIGNAL
        </span>
        <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
          ACTIVE
        </span>
      </div>

      {/* Header */}
      <h1 className="font-headline text-5xl font-black uppercase">MUSIC</h1>
      <div className="h-1 w-24 bg-primary my-4" />
      <p className="font-body italic opacity-70">
        Crate digging, live shows, and everything in between.
      </p>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">

        {/* LIBRARY — active */}
        <a
          href="/music/index.html"
          className="border border-black/10 dark:border-white/10 p-4 block hover:border-tertiary hover:text-tertiary transition-colors"
        >
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            THE LIBRARY
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            LIBRARY
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            The crate. 8 records, hand-picked.
          </div>
          <div className="mt-3">
            <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
              ACTIVE
            </span>
          </div>
        </a>

        {/* GIG ARCHIVE — stub */}
        <div
          className="border border-black/10 dark:border-white/10 p-4 opacity-40 cursor-not-allowed pointer-events-none"
          aria-disabled="true"
        >
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            THE GIG ARCHIVE
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            GIG ARCHIVE
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            Live shows, documented.
          </div>
          <div className="mt-3">
            <span className="stamp-red font-mono text-[9px] uppercase tracking-widest font-bold">
              COMING SOON
            </span>
          </div>
        </div>

        {/* T-SHIRT ARCHIVE — stub */}
        <div
          className="border border-black/10 dark:border-white/10 p-4 opacity-40 cursor-not-allowed pointer-events-none"
          aria-disabled="true"
        >
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            THE T-SHIRT ARCHIVE
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            T-SHIRT ARCHIVE
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            Every shirt, every tour.
          </div>
          <div className="mt-3">
            <span className="stamp-red font-mono text-[9px] uppercase tracking-widest font-bold">
              COMING SOON
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
```

Note on `.stamp-green` / `.stamp-red`: these are CSS `filter`-based classes defined in `app/globals.css`. They apply a color tint via `sepia + hue-rotate + saturate`. They are applied as plain Tailwind-style class strings (no special syntax needed).

- [ ] Create the file.

### Step 2: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] Run and confirm no errors.

### Step 3: Run a production build

```bash
npm run build
```

Expected: build completes with no errors. The output should include a static route for `/music`. If the build shows `/music` as `ƒ` (dynamic) instead of `○` (static), check that there is no `export const dynamic = 'force-dynamic'` accidentally in the file.

- [ ] Run and confirm clean build. Confirm `/music` appears as static (`○`) in the build output.

### Step 4: Commit

```bash
git add app/music/page.tsx
git commit -m "feat(music): add THE SIGNAL landing page"
```

- [ ] Commit.

---

## Verification Checklist

After both tasks are complete:

- [ ] `npm run build` passes clean
- [ ] `/music` renders the landing page (not the external library app)
- [ ] `/music/index.html` loads the external library app (test in browser — the proxy must still work)
- [ ] Desktop nav: hovering SIGNAL reveals dropdown with LIBRARY link + 2 greyed stubs
- [ ] Desktop nav: SIGNAL label links to `/music`
- [ ] Mobile nav: SIGNAL appears after RECORD as a plain link
- [ ] LIBRARY nav item uses `<a>` (not `<Link>`) — verify in browser DevTools that no prefetch request is made for `/music/index.html`
- [ ] Dark mode: check the dropdown and landing page render correctly in dark mode
