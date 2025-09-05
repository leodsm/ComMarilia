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
  return (
    <Link
      href={href}
      target="_blank"
      className="group block bg-white rounded-lg border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100" />
        )}
        {post.category ? (
          <span
            className={`absolute left-2 top-2 z-10 ${badgeColor(
              post.category.slug
            )} text-white text-xs font-medium px-2 py-1 rounded`}
          >
            {post.category.name}
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <h3
          className="text-base font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-[#2563eb]"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {post.title}
        </h3>
        <p className="mt-2 text-xs text-neutral-600">
          {post.readingTimeMin} min de leitura • {dateStr}
        </p>
      </div>
    </Link>
  );
}

