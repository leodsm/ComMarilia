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
};

function badgeColor(slug?: string) {
  if (!slug) return "bg-[#2563eb]"; // default to blue
  const colors = ["bg-[#2563eb]", "bg-[#dc2626]", "bg-[#ea580c]"];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function PostCard({ post }: { post: PostCardData }) {
  const href = `https://portal.commarilia.com${post.uri}`;
  const dateStr = formatDate(post.date);
  const ariaLabel = `Leia: ${post.title}`;

  return (
    <Link
      href={href}
      target="_blank"
      aria-label={ariaLabel}
      className="group relative block rounded-xl shadow-lg overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50"
    >
      <div className="relative w-full aspect-[4/5]">
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
          <div className="absolute inset-0 bg-gray-300" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

        {/* Category badge */}
        {post.category ? (
          <span
            className={`absolute left-2 top-2 z-10 ${badgeColor(
              post.category.slug
            )} text-white text-[11px] uppercase tracking-widest font-medium px-2 py-1 rounded-full`}
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
          <p className="mt-1 text-white/90 text-[clamp(13px,1.6vw,16px)] leading-[1.35]">
            {post.readingTimeMin} min de leitura • {dateStr}
          </p>
        </div>
      </div>
    </Link>
  );
}
