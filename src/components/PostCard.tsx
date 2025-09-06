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

  function normalizeKey(value?: string): string {
    if (!value) return "";
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function categoryBadgeColor(name?: string, slug?: string): string {
    const key = normalizeKey(slug || name);
    switch (key) {
      case "brasil":
        return "bg-[#2563eb]"; // azul
      case "marilia":
        return "bg-[#dc2626]"; // vermelho
      case "mundo":
        return "bg-[#0ea5e9]"; // sky
      case "regiao":
        return "bg-[#ea580c]"; // laranja
      case "saude":
        return "bg-[#16a34a]"; // verde
      default:
        return "bg-white/15"; // fallback discreto
    }
  }

  return (
    <Link
      href={href}
      target="_blank"
      aria-label={ariaLabel}
      className="group relative block rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 transition-transform duration-200 hover:-translate-y-0.5 md:hover:-translate-y-1"
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
          <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900 skeleton" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80" />

        {/* Removed top-left category badge as requested */}

        {/* Text block */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
          <span
            className={`inline-block text-white text-[11px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full mb-2 ring-1 ring-white/15 ${categoryBadgeColor(post.category?.name, post.category?.slug)}`}
          >
            {post.category?.name ?? "Uncategorized"}
          </span>
          <h3 className="font-extrabold text-[16px] leading-[1.18] break-words">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="mt-1 text-white/85 text-[clamp(13px,1.6vw,16px)] leading-[1.35] line-clamp-2">
              {post.excerpt}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
