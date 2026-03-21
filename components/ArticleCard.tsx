import Link from 'next/link';
import Image from 'next/image';

interface ArticleCardProps {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
  variant?: 'default' | 'featured' | 'compact';
  rotation?: string;
}

export default function ArticleCard({
  slug,
  title,
  date,
  excerpt,
  tags = [],
  coverImage,
  variant = 'default',
  rotation = '0deg',
}: ArticleCardProps) {
  const year = new Date(date).getFullYear();

  if (variant === 'featured') {
    return (
      <Link href={`/writing/${slug}`} className="block group md:col-span-7">
        <div
          className="tape-effect bg-surface-container-highest dark:bg-surface-container p-8 shadow-sm relative overflow-hidden transition-transform duration-300 hover:rotate-0"
          style={{ transform: `rotate(${rotation})` }}
        >
          <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-zinc-400">
            #{slug.slice(0, 5).toUpperCase()}
          </div>
          {coverImage && (
            <div className="relative w-full aspect-[16/9] mb-6 overflow-hidden">
              <Image src={coverImage} alt={title} fill className="object-cover" />
            </div>
          )}
          <div className="text-secondary font-mono text-xs mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary block" />
            {year} / ESSAY
          </div>
          <h2 className="font-headline font-black text-4xl md:text-5xl leading-none mb-4 group-hover:text-primary transition-colors underline decoration-4 decoration-tertiary/30 uppercase">
            {title}
          </h2>
          {excerpt && (
            <p className="font-body text-on-surface-variant max-w-md italic mb-6">{excerpt}</p>
          )}
          <div className="flex gap-4">
            <span className="bg-primary text-white font-mono text-[10px] px-2 py-0.5">READ_NOW</span>
            {tags[0] && (
              <span className="border border-outline-variant font-mono text-[10px] px-2 py-0.5">
                {tags[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-4 bg-tertiary clip-path-drip opacity-40" />
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/writing/${slug}`} className="block group md:col-span-4">
        <div
          className="bg-surface-container-low dark:bg-surface-container border-b-[12px] border-secondary p-6 transition-transform duration-300"
          style={{ transform: `rotate(${rotation})` }}
        >
          <div className="text-primary font-mono text-xs mb-2 italic">{year} / FRAGMENT</div>
          <h2 className="font-headline font-bold text-3xl leading-tight mb-4 group-hover:text-primary transition-colors">
            {title}
          </h2>
          {excerpt && (
            <p className="font-body text-sm text-on-surface-variant mb-6">{excerpt}</p>
          )}
          <div className="w-12 h-1 bg-on-surface-variant opacity-20" />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/writing/${slug}`} className="block group md:col-span-8">
      <div className="p-8 border-t-8 border-primary bg-surface dark:bg-surface-container hover:bg-white dark:hover:bg-surface-container-high transition-colors">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-mono text-[9px] px-2 py-0.5">
            {year}
          </span>
          {tags[0] && (
            <span className="bg-primary text-white font-mono text-[9px] px-2 py-0.5">
              {tags[0].toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tighter leading-[0.85] italic group-hover:skew-x-[-5deg] transition-transform uppercase">
          {title}
        </h2>
        {excerpt && (
          <p className="font-body mt-6 max-w-xl text-lg leading-relaxed text-on-surface-variant">
            {excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
