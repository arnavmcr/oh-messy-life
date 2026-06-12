import Link from 'next/link';
import { getAllPosts } from '@/lib/content';
import { getAllJournalEntries } from '@/lib/journal';
import { getChangelogEntries } from '@/lib/changelog';
import HomepageHero from '@/components/HomepageHero';

function buildTagEdges(
  writingLeaves: { slug: string; tags: string[] }[],
  recordLeaves:  { slug: string; tags: string[] }[],
): [string, string][] {
  // Index each leaf by node id → tag set
  const nodes: { id: string; tags: Set<string> }[] = [
    ...writingLeaves.map((p, i) => ({ id: `w${i}`, tags: new Set(p.tags) })),
    ...recordLeaves.map((e, i)  => ({ id: `r${i}`, tags: new Set(e.tags) })),
  ];

  // Per-node cross-edge cap prevents noisy graphs at full density
  const MAX_EDGES_PER_NODE = 6;
  const edgeCounts = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const edges: [string, string][] = [];
  const seen = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if ((edgeCounts.get(a.id) ?? 0) >= MAX_EDGES_PER_NODE) continue;
      if ((edgeCounts.get(b.id) ?? 0) >= MAX_EDGES_PER_NODE) continue;
      const key = `${a.id}|${b.id}`;
      if (seen.has(key)) continue;
      // Check for shared tag
      const shared = [...a.tags].some((t) => b.tags.has(t));
      if (!shared) continue;
      seen.add(key);
      edges.push([a.id, b.id]);
      edgeCounts.set(a.id, (edgeCounts.get(a.id) ?? 0) + 1);
      edgeCounts.set(b.id, (edgeCounts.get(b.id) ?? 0) + 1);
    }
  }

  return edges;
}

export default function HomePage() {
  const posts = getAllPosts();
  const changelog = getChangelogEntries(10);
  const journalEntries = getAllJournalEntries();

  const writingLeaves = posts.map((p) => ({ slug: p.slug, title: p.title, tags: p.tags ?? [] }));
  const recordLeaves  = journalEntries.map((e) => ({ slug: e.slug, title: e.title, tags: e.tags ?? [] }));
  const tagEdges = buildTagEdges(writingLeaves, recordLeaves);

  return (
    <main>
      {/* Interactive graph hero + status banner */}
      <HomepageHero writingLeaves={writingLeaves} recordLeaves={recordLeaves} tagEdges={tagEdges} />

      {/* ── Intro ──────────────────────────────────────────────────────── */}
      <section className="intro">
        <div className="intro-inner">
          <div className="intro-eyebrow">liminality as a filing system</div>
          <h1 className="intro-headline">
            suspended between <span className="accent">idea</span> and object
          </h1>
          <p className="intro-blurb">
            writing, a monthly thingi, and projects paused mid-thought &mdash;
            collected here because they wouldn&rsquo;t stay filed away.
            a holding space for things still in transit.
          </p>
          <div className="chip-row">
            <Link className="chip coral"  href="/writing">writing →</Link>
            <Link className="chip violet" href="/record">record →</Link>
            <Link className="chip kelp"   href="/music">music →</Link>
            <Link className="chip wine"   href="/projects">labs →</Link>
          </div>
        </div>
      </section>

      {/* ── Changelog ──────────────────────────────────────────────────── */}
      <section className="changelog-section hp-section">
        <div className="hp-section-inner">
          <div style={{ marginBottom: '36px' }}>
            <h2 className="hp-section-title">
              <span className="accent">lately</span>
            </h2>
            <p className="hp-section-sub">
              every push and pour and patch — chronologically incorrect, mostly.
            </p>
          </div>

          <div className="cl-list">
            {changelog.map((e, i) => (
              <Link key={i} className="cl-row" href={e.href}>
                <span className="cl-date">{e.date}</span>
                <span className={`cl-type ${e.type}`}>{e.type}</span>
                <span className="cl-desc">{e.description}</span>
                <span className="cl-arrow">↗</span>
              </Link>
            ))}
          </div>

          <div className="cl-foot">
            <span>{changelog.length} of many</span>
            <Link href="/writing">full log ↗</Link>
          </div>
        </div>
      </section>

      {/* ── Feature grid ───────────────────────────────────────────────── */}
      <section className="hp-section">
        <div className="hp-section-inner">
          <div style={{ marginBottom: '36px' }}>
            <h2 className="hp-section-title">
              the <span className="accent">void</span>
            </h2>
            <p className="hp-section-sub">
              essays, reviews, dispatches — slowly accumulating, no schedule.
            </p>
          </div>

          <div className="hp-card-grid">
            {/* Writing card */}
            <div className="hp-card">
              <h3 className="hp-card-title coral">latest writing</h3>
              <p className="hp-card-sub">most recent things, freshly published.</p>
              <ul className="hp-card-list">
                {posts.slice(0, 4).map((post, i) => (
                  <li key={post.slug}>
                    <Link href={`/writing/${post.slug}`}>
                      <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                      <span>{post.title}</span>
                      <span className="arrow">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Labs card */}
            <div className="labs-card">
              <h3 className="hp-card-title">labs</h3>
              <p className="hp-card-sub">two-week sprints. mostly things i&rsquo;d otherwise not get around to.</p>
              <div style={{ marginTop: '6px' }}>
                <div className="labs-progress"><i /></div>
                <div className="labs-foot" style={{ marginTop: '8px' }}>
                  <span>load</span>
                  <span>25%</span>
                </div>
              </div>
              <button disabled className="labs-soon">soon</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
