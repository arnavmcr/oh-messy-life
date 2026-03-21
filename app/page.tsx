import Link from 'next/link';
import { getAllPosts } from '@/lib/content';

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

      {/* ── Hero: Workbench / Manifesto ───────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-[#ebebeb] dark:bg-zinc-900 border-b border-black/5 dark:border-white/5">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none scan-line" />

        <div className="grid grid-cols-1 md:grid-cols-12 max-w-[1600px] mx-auto min-h-[90vh]">
          {/* Left: Brand panel */}
          <div className="md:col-span-4 border-r border-black/5 dark:border-white/5 p-8 flex flex-col justify-between bg-white/30 dark:bg-black/30">
            <div className="relative">
              <div className="space-y-4">
                <div className="bg-black dark:bg-white text-white dark:text-black inline-block px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
                  System_ID: OML_001
                </div>
                <p className="font-headline font-bold text-3xl leading-none tracking-tighter text-black dark:text-white uppercase">
                  Technical <br />
                  <span className="text-primary italic">Vandalism</span> <br />
                  Bureau
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-body leading-relaxed max-w-xs">
                  A public personal archive. Writing, projects, music, and the
                  non-linear record of a generalist&apos;s life.
                </p>
              </div>
            </div>

            <div className="mt-12 space-y-2 border-t border-black/10 dark:border-white/10 pt-8">
              <p className="text-[10px] font-mono uppercase text-zinc-400">
                Status: <span className="text-tertiary font-bold">Active_Breach</span>
              </p>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary" />
                <div className="w-2 h-2 bg-secondary" />
                <div className="w-2 h-2 bg-tertiary" />
              </div>
            </div>
          </div>

          {/* Right: Title + Workbench */}
          <div className="md:col-span-8 p-0 flex flex-col relative overflow-hidden">
            {/* Large header */}
            <div className="p-8 md:p-12 border-b border-black/5 dark:border-white/5">
              <h1 className="distressed-text font-headline text-[80px] md:text-[180px] font-black leading-[0.75] text-black dark:text-white tracking-tighter mb-4">
                THE<br />NEXUS
              </h1>
              <div className="max-w-xl">
                <p className="text-xl md:text-2xl font-headline font-medium leading-tight text-zinc-900 dark:text-zinc-100 tracking-tight">
                  A centralized repository for{' '}
                  <span className="bg-primary/10 px-1 border-b-2 border-primary/40">
                    technical vandalism
                  </span>
                  , chaotic archival, and high-spec engineering prototypes.
                </p>
              </div>
            </div>

            {/* Workbench area */}
            <div className="flex-grow p-8 bg-[#fafafa] dark:bg-zinc-800 relative min-h-[400px]">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative h-full w-full">
                {/* Data card */}
                <div className="absolute top-10 right-10 w-64 p-4 bg-secondary text-white rotate-1 shadow-2xl z-20 border border-white/10">
                  <div className="flex justify-between items-start mb-6">
                    <p className="font-headline font-black text-xl tracking-tighter italic">
                      VANDAL_01
                    </p>
                    <span className="text-[8px] border border-white/20 px-1">CONFIDENTIAL</span>
                  </div>
                  <p className="text-[9px] font-mono opacity-60 leading-tight">
                    ENCRYPTION: AES_256_V2<br />
                    ORIGIN: 0x3800c2-FF1721
                  </p>
                </div>

                {/* Protocol card */}
                <div className="absolute bottom-10 left-1/3 w-48 p-4 bg-white dark:bg-zinc-700 border-2 border-primary rotate-[-6deg] shadow-2xl z-30">
                  <div className="flex flex-col items-center justify-center py-6 border border-primary/10 bg-primary/5">
                    <span className="material-symbols-outlined text-primary text-4xl mb-2">
                      token
                    </span>
                    <span className="font-label text-[10px] font-black tracking-widest text-primary uppercase">
                      CORE_PROTOCOL
                    </span>
                  </div>
                </div>

                {/* System log */}
                <div className="absolute top-10 left-4 w-64 p-6 bg-tertiary-fixed text-on-tertiary-fixed rotate-2 shadow-xl border border-black/5 tape-effect z-20">
                  <h4 className="font-label font-bold text-[10px] border-b border-black/20 pb-1 mb-3 flex justify-between items-center">
                    SYSTEM_LOG_01
                    <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse" />
                  </h4>
                  <div className="space-y-1.5 opacity-60">
                    <div className="h-0.5 bg-black/30 w-full" />
                    <div className="h-0.5 bg-black/30 w-4/5" />
                    <div className="h-0.5 bg-black/30 w-5/6" />
                  </div>
                  <p className="text-[9px] font-mono mt-4">UPLINK_STABLE: 99.9%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
