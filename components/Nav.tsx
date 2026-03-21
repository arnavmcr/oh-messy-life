import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';

const navLinks = [
  { href: '/writing', label: 'WRITING' },
  { href: '/projects', label: 'LABS', soon: true },
  { href: '/music', label: 'SIGNAL', soon: true },
];

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-sm flex justify-between items-center w-full px-4 py-3 border-b border-black/10 dark:border-white/10">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex flex-col">
          <span className="text-sm font-black italic tracking-tighter text-black dark:text-white font-headline leading-none">
            OH MESSY LIFE
          </span>
          <span className="text-[8px] font-mono opacity-40 uppercase">Root_Access_Granted</span>
        </Link>

        <div className="h-8 w-[1px] bg-black/10 dark:bg-white/10 mx-2" />

        <div className="hidden md:flex gap-6 items-center font-label uppercase tracking-widest text-[10px] font-bold">
          {navLinks.map(({ href, label, soon }) =>
            soon ? (
              <span key={label} className="opacity-30 cursor-not-allowed">{label}</span>
            ) : (
              <Link key={label} href={href} className="hover:text-primary transition-colors">
                {label}
              </Link>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-label text-[9px] opacity-40 hidden sm:block uppercase font-bold tracking-tighter">
          BUILD: 0.1.0_ALPHA
        </span>
        <DarkModeToggle />
        <span className="material-symbols-outlined text-black dark:text-white p-1 hover:text-primary transition-colors text-lg cursor-pointer">
          terminal
        </span>
      </div>
    </nav>
  );
}
