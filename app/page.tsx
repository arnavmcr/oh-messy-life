import Link from 'next/link';
import { getAllPosts } from '@/lib/content';
import Changelog from '@/components/Changelog';

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <main className="pt-12 min-h-screen">
      {/* Ink filter SVG */}
      <svg className="absolute w-0 h-0" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="ink-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>
      </svg>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-[#ebebeb] dark:bg-zinc-900 border-b border-black/5 dark:border-white/5">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none scan-line" />
        <div className="max-w-[1600px] mx-auto px-8 md:px-16 py-24 md:py-32">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-8">
            public archive
          </p>
          <h1 className="font-headline font-black text-[80px] md:text-[160px] leading-[0.85] tracking-tighter text-black dark:text-white mb-12">
            oh messy<br />life.
          </h1>
          <nav className="flex flex-wrap gap-3">
            <Link
              href="/writing"
              className="border-[1.5px] border-black dark:border-white text-black dark:text-white font-label text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            >
              writing ↗
            </Link>
            <Link
              href="/record"
              className="border-[1.5px] border-secondary dark:border-[#9f7bff] text-secondary dark:text-[#9f7bff] font-label text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-secondary dark:hover:bg-[#9f7bff] hover:text-white dark:hover:text-black transition-colors"
            >
              record ↗
            </Link>
            <Link
              href="/projects"
              className="border-[1.5px] border-primary text-primary font-label text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-primary hover:text-white transition-colors"
            >
              projects ↗
            </Link>
            <Link
              href="/music"
              className="border-[1.5px] border-tertiary dark:border-tertiary-fixed text-tertiary dark:text-tertiary-fixed font-label text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-tertiary dark:hover:bg-tertiary-fixed hover:text-white dark:hover:text-black transition-colors"
            >
              music ↗
            </Link>
          </nav>
        </div>
      </section>

      {/* ── Changelog ──────────────────────────────────────────────────────── */}
      <Changelog />

      {/* ── Content Sections ────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto border-x border-black/5 dark:border-white/5 bg-white dark:bg-black">
        <section className="grid grid-cols-1 md:grid-cols-12">
          {/* Scriptorium: Writing */}
          <div className="md:col-span-8 p-8 md:p-16 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10">
            <div className="flex items-center gap-4 mb-12">
              <Link
                href="/writing"
                className="bg-primary text-white font-label text-[10px] uppercase px-4 py-1.5 font-bold tracking-widest hover:bg-primary-dark transition-colors"
              >
                SCRIPTORIUM // ARCHIVE_01
              </Link>
              <div className="h-[1px] flex-grow bg-black/10 dark:bg-white/10" />
            </div>

            <h2 className="font-headline text-5xl md:text-7xl font-black mb-8 tracking-tighter distressed-text text-black dark:text-white">
              MANUSCRIPT<br />_VOID
            </h2>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 mb-12 text-lg leading-snug font-medium italic border-l-4 border-primary pl-6">
                  &ldquo;The grid is a suggestion, the mark is an absolute. Everything else is performance.&rdquo;
                </p>
                <p className="text-sm text-zinc-400 font-mono">ENTRIES: {posts.length}</p>
              </div>

              <ul className="space-y-px bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                {posts.slice(0, 4).map((post, i) => (
                  <li key={post.slug}>
                    <Link
                      href={`/writing/${post.slug}`}
                      className="flex items-center gap-6 group/item cursor-pointer bg-white dark:bg-zinc-950 p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <span className="text-primary font-label text-xs font-bold flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-headline text-base font-bold group-hover/item:translate-x-1 transition-transform flex-grow">
                        {post.title}
                      </span>
                      <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 group-hover/item:text-primary flex-shrink-0">
                        north_east
                      </span>
                    </Link>
                  </li>
                ))}
                {posts.length > 4 && (
                  <li>
                    <Link
                      href="/writing"
                      className="flex items-center justify-center gap-2 p-4 font-mono text-[10px] text-zinc-400 hover:text-primary transition-colors"
                    >
                      VIEW ALL {posts.length} ENTRIES →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Labs sidebar */}
          <div className="md:col-span-4 p-8 bg-zinc-50 dark:bg-zinc-900 flex flex-col">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="font-headline text-4xl font-black text-black dark:text-white tracking-tighter">
                  LABS_EXT
                </h2>
                <p className="text-[9px] font-mono opacity-50 uppercase tracking-widest">
                  EXPERIMENTAL_NODE: ENV_PR_01
                </p>
              </div>
              <span className="material-symbols-outlined text-tertiary text-4xl">biotech</span>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-6 mb-8 border border-zinc-200 dark:border-zinc-700 shadow-sm relative tape-effect">
              <p className="font-label text-[10px] uppercase text-tertiary font-black mb-3 tracking-widest">
                STATUS:
              </p>
              <h3 className="font-headline font-black text-2xl mb-4 text-black dark:text-white italic leading-none">
                COMING_SOON
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                Projects, interactive experiments, and annotated case studies — in construction.
              </p>
              <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-1.5 overflow-hidden">
                <div className="bg-tertiary w-1/4 h-full animate-pulse" />
              </div>
              <div className="flex justify-between mt-2 font-mono text-[9px] opacity-40">
                <span>LOAD_LVL</span>
                <span>25%</span>
              </div>
            </div>

            <div className="space-y-1 bg-black p-4 mt-auto">
              <button
                disabled
                className="w-full bg-zinc-700 text-white/40 font-label py-4 uppercase text-[10px] tracking-widest font-bold cursor-not-allowed"
              >
                INIT_ENVIRONMENT
              </button>
            </div>
          </div>
        </section>

        {/* Vault section */}
        <section className="border-t border-black/10 dark:border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[300px]">
            <div className="md:col-span-9 bg-secondary p-8 md:p-12 text-white relative overflow-hidden">
              <h2 className="font-headline text-6xl md:text-[100px] font-black mb-8 italic tracking-tighter distressed-text leading-none">
                VAULT_99
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
                <div className="border-l-2 border-white/20 pl-4">
                  <p className="font-label text-[9px] opacity-60 uppercase mb-1 font-bold tracking-widest">
                    ENTRIES
                  </p>
                  <p className="font-headline text-4xl font-black">{posts.length}</p>
                </div>
                <div className="border-l-2 border-tertiary-fixed pl-4">
                  <p className="font-label text-[9px] opacity-60 uppercase mb-1 font-bold tracking-widest">
                    SEVERITY
                  </p>
                  <p className="font-headline text-4xl font-black text-tertiary-fixed">CRIT_01</p>
                </div>
                <div className="col-span-2 md:col-span-1 border-l-2 border-white/20 pl-4">
                  <p className="font-label text-[9px] opacity-60 uppercase mb-1 font-bold tracking-widest">
                    SIGNATURE
                  </p>
                  <p className="font-mono text-[10px] break-all opacity-90 leading-relaxed">
                    0x3800c2-FF1721-006a3c
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 bg-zinc-900 text-zinc-400 p-8 font-mono text-[10px] leading-tight overflow-hidden relative">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
                <span className="text-white text-[9px] font-bold">CONSOLE_LOG</span>
                <span className="text-primary flex items-center gap-1 animate-pulse">LIVE</span>
              </div>
              <div className="space-y-1">
                <p>&gt; MOUNTING_ARCHIVE_01...</p>
                <p>&gt; CHECKING_INTEGRITY... <span className="text-tertiary">OK</span></p>
                <p>&gt; INJECTING_CHAOS_ELEMENTS...</p>
                <p className="text-secondary">&gt; SUCCESS: GRID_DEFACED</p>
                <p>&gt; MONITORING_UPLINK...</p>
                <p className="opacity-20">&gt; 0x442... AUTHENTICATED</p>
                <p className="text-primary">&gt; ERR: NON_LINEAR_ACCESS</p>
                <p>&gt; RETRYING...</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
