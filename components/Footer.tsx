const socialLinks = [
  { label: 'INSTAGRAM', href: 'https://instagram.com/arnavmcr' },
  { label: 'GITHUB', href: 'https://github.com/arnavmcr' },
  { label: 'ARE.NA', href: '#' },
  { label: 'READ.CV', href: '#' },
  { label: 'SUBSTACK', href: 'https://arnavmcr.substack.com' },
  { label: 'EMAIL', href: 'mailto:shetharnav98@gmail.com' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-black border-t border-black/10 dark:border-white/10 py-12 px-8">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black italic tracking-tighter text-black dark:text-white font-headline">
              OH MESSY LIFE
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-black dark:bg-white text-white dark:text-black">
              v0.1.0
            </span>
          </div>
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-zinc-400 leading-relaxed max-w-sm">
            PRECISION VANDALISM // ALL_RIGHTS_VANDALIZED // 2024 ARCHIVE PROTOCOL
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
            SOCIAL_NODES
          </span>
          <div className="flex flex-col gap-1">
            {socialLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="font-label text-[10px] uppercase tracking-widest hover:text-primary transition-colors font-bold"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600">
            SYSTEM STATUS: RUNNING
          </p>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 bg-primary" />
            <div className="w-2 h-2 bg-secondary" />
            <div className="w-2 h-2 bg-tertiary" />
          </div>
        </div>
      </div>
    </footer>
  );
}
