import Image from "next/image";
import Link from "next/link";

export type PostCardData = {
  id: string;
  title: string;
  date: string; // ISO
  uri: string; // e.g., /post-slug/
  image: string | null;
  readingTimeMin: number;
  category: { name: string; slug: string } | null;
  excerpt?: string | null;
};

export function PostCard({ post }: { post: PostCardData }) {
  const href = `https://portal.commarilia.com${post.uri}`;
  const ariaLabel = `Leia: ${post.title}`;

  return (
    <Link
      href={href}
      target="_blank"
      aria-label={ariaLabel}
      className="group relative block rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
    >
      <div className="relative w-full aspect-[3/4]">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80" />

        {/* Category badge */}
        {post.category ? (
          <span
            className={`absolute left-3 top-3 z-10 text-white/95 text-[11px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm`}
          >
            {post.category.name}
          </span>
        ) : null}

        {/* Text block */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
          <h3
            className="font-extrabold text-[clamp(20px,2.2vw,24px)] leading-[1.18]"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {post.title}
          </h3>
          {post.excerpt ? (
            <p
              className="mt-1 text-white/85 text-[clamp(13px,1.6vw,16px)] leading-[1.35]"
              style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
