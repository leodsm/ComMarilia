"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PostCard, type PostCardData } from "./PostCard";
import { StoryPlayer, type NewsStory } from "./StoryPlayer";
import { NewsModal } from "./NewsModal";

type PageInfo = { endCursor: string | null; hasNextPage: boolean };

export function PostsGrid({ initialItems, initialPageInfo }: { initialItems: PostCardData[]; initialPageInfo: PageInfo }) {
  const [items, setItems] = useState<PostCardData[]>(initialItems);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsStory, setNewsStory] = useState<NewsStory | null>(null);

  // const canLoadMore = pageInfo.hasNextPage && !loading;

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && pageInfo.hasNextPage && !loading) {
          void loadMore();
        }
      },
      { rootMargin: "800px 0px 800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageInfo.hasNextPage, loading]);

  async function loadMore() {
    if (!pageInfo.hasNextPage || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (pageInfo.endCursor) params.set("after", pageInfo.endCursor);
      params.set("first", "9");
      const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { items: PostCardData[]; pageInfo: PageInfo };
      setItems((prev) => [...prev, ...json.items]);
      setPageInfo(json.pageInfo);
    } catch {
      // fail silently for UX; could add toast here
      // console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const stories: NewsStory[] = useMemo(() => {
    return items.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: (p.excerpt || "").trim(),
      imageUrl: p.image || "",
      category: p.category?.name || "Geral",
      link: `https://portal.commarilia.com${p.uri}`,
      publishDate: p.date,
      excerpt: p.excerpt || null,
      contentHtml: p.contentHtml || null,
      screens: [
        {
          type: "text",
          content: p.title,
          imageUrl: p.image || undefined,
        },
      ],
    }));
  }, [items]);

  const grid = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p, i) => (
          <PostCard key={p.id} post={p} onOpenStory={() => { setIndex(i); setOpen(true); }} />
        ))}
      </div>
    ),
    [items]
  );

  return (
    <div className="max-w-[990px] mx-auto px-4 py-8">
      {grid}
      <div ref={sentinelRef} className="h-10" />
      {loading ? (
        <div className="mt-6 text-center text-sm text-neutral-500">Carregando mais…</div>
      ) : !pageInfo.hasNextPage ? (
        <div className="mt-6 text-center text-sm text-neutral-400">Você chegou ao fim.</div>
      ) : null}
      {open && stories.length > 0 && (
        <StoryPlayer
          stories={stories}
          currentStoryIndex={index}
          onClose={() => setOpen(false)}
          onOpenNewsModal={(story) => {
            setNewsStory(story);
            setNewsOpen(true);
          }}
          onNext={() => setIndex((p) => Math.min(p + 1, stories.length - 1))}
          onPrevious={() => setIndex((p) => Math.max(p - 1, 0))}
        />
      )}
      <NewsModal story={newsStory} isOpen={newsOpen} onClose={() => setNewsOpen(false)} />
    </div>
  );
}
