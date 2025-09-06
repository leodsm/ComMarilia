"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type StoryScreen = {
  type?: "text" | "quote";
  content?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  slideTitle?: string | null;
  showButton?: boolean | null;
  quote?: string;
  author?: string;
};

export type NewsStory = {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  category: string;
  screens: StoryScreen[];
  // Optional: link to full post
  link?: string;
  // Optional: full content (HTML) for modal
  contentHtml?: string | null;
  // Optional: publish date (ISO)
  publishDate?: string;
  // Optional: excerpt text (plain)
  excerpt?: string | null;
};

// Simple category color util
export function categoryHex(category: string): string {
  const map: Record<string, string> = {
    Saúde: "#10b981",
    Cidade: "#2563eb",
    Cultura: "#8b5cf6",
    Esportes: "#f59e0b",
    Educação: "#e11d48",
    Brasil: "#2563eb",
    Marília: "#dc2626",
    Mundo: "#0ea5e9",
    Região: "#ea580c",
  };
  if (map[category]) return map[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  const r = (hash & 0xff).toString(16).padStart(2, "0");
  const g = ((hash >> 8) & 0xff).toString(16).padStart(2, "0");
  const b = ((hash >> 16) & 0xff).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function Button({
  children,
  className = "",
  onClick,
  variant = "ghost",
  size = "md",
}: React.PropsWithChildren<{ className?: string; onClick?: React.MouseEventHandler; variant?: "ghost" | "solid"; size?: "md" | "icon" }>) {
  const base = "inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizes = size === "icon" ? "h-10 w-10" : "h-10 px-4";
  const styles =
    variant === "solid"
      ? "bg-white text-black hover:opacity-90"
      : "text-white border border-white/30 hover:bg-white hover:text-black";
  return (
    <button className={`${base} ${sizes} ${styles} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

function ImageWithFallback({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [err, setErr] = useState(false);
  const url = err || !src ? "https://images.unsplash.com/photo-1545972152-7051c7c4e9f5?q=80&w=1200&auto=format&fit=crop" : src;
  return <img src={url} alt={alt || ""} className={className} onError={() => setErr(true)} />;
}

export function StoryPlayer({
  stories,
  currentStoryIndex,
  onClose,
  onOpenNewsModal,
  onNext,
  onPrevious,
}: {
  stories: NewsStory[];
  currentStoryIndex: number;
  onClose: () => void;
  onOpenNewsModal: (story: NewsStory) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStory = stories[currentStoryIndex];
  const currentScreen = currentStory?.screens?.[currentScreenIndex];

  useEffect(() => setCurrentScreenIndex(0), [currentStoryIndex]);

  // Lock background scroll while StoryPlayer is open
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const prevOverscroll = html.style.overscrollBehavior;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    html.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      html.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentStoryIndex > 0) onPrevious();
          break;
        case "ArrowDown":
          e.preventDefault();
          if (currentStoryIndex < stories.length - 1) onNext();
          else onClose();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentScreenIndex > 0) setCurrentScreenIndex((p) => p - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentStory && currentScreenIndex < (currentStory.screens.length - 1)) setCurrentScreenIndex((p) => p + 1);
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrevious, currentScreenIndex, currentStoryIndex, currentStory?.screens.length, stories.length]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        if (currentStoryIndex < stories.length - 1) onNext();
        else onClose();
      } else {
        if (currentStoryIndex > 0) onPrevious();
      }
    };
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel as EventListener);
  }, [currentStoryIndex, stories.length, onNext, onPrevious, onClose]);

  useEffect(() => {
    const next = stories[currentStoryIndex + 1];
    if (!next) return;
    const list = [next.imageUrl, ...(next.screens?.map((s) => s.imageUrl).filter(Boolean) as string[])];
    list.slice(0, 2).forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [currentStoryIndex, stories]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startX || !startY) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const min = 50;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > min) {
      if (deltaY > 0) {
        onClose();
      } else {
        if (currentStoryIndex < stories.length - 1) onNext();
        else onClose();
      }
      return;
    }
    if (Math.abs(deltaX) > min) {
      if (deltaX > 0) {
        if (currentScreenIndex > 0) setCurrentScreenIndex((p) => p - 1);
      } else {
        if (currentStory && currentScreenIndex < (currentStory.screens.length - 1)) setCurrentScreenIndex((p) => p + 1);
      }
    }
    setStartX(0);
    setStartY(0);
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const w = rect.width;
    if (x < w / 3) {
      if (currentScreenIndex > 0) setCurrentScreenIndex((p) => p - 1);
    } else if (x > (2 * w) / 3) {
      if (currentStory && currentScreenIndex < (currentStory.screens.length - 1)) setCurrentScreenIndex((p) => p + 1);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50">
      <div className="flex items-center justify-center w-full h-full">
        <div
          ref={containerRef}
          className="swiper-main-wrapper w-full h-full max-w-[450px] relative overflow-hidden rounded-none md:rounded-[2rem] md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] md:aspect-[9/16] md:h-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleTap}
        >
          <div className="news-card h-full w-full">
            {currentScreen?.videoUrl ? (
              <video
                className="absolute inset-0 w-full h-full object-cover z-0"
                src={currentScreen.videoUrl}
                playsInline
                muted
                autoPlay
                loop
              />
            ) : (
              <ImageWithFallback
                src={currentScreen?.imageUrl || currentStory.imageUrl}
                alt={currentScreen?.content}
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}

            <div className="news-content">
              <div className="w-full max-w-3xl">
                {currentScreenIndex === 0 && (
                  <>
                    <span
                      className={`text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-widest`}
                      style={{ backgroundColor: categoryHex(currentStory.category) }}
                    >
                      {currentStory.category}
                    </span>
                    <h1 className="text-2xl md:text-2xl lg:text-3xl font-black mb-2 text-left">
                      {currentStory.title}
                    </h1>
                    {currentStory.subtitle ? (
                      <p className="text-base opacity-90 mb-6 text-left">{currentStory.subtitle}</p>
                    ) : null}
                    <Button
                      variant="ghost"
                      className="text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewsModal(currentStory);
                      }}
                    >
                      Leia Mais
                    </Button>
                    {currentScreen?.slideTitle || currentScreen?.content ? (
                      <div className="mt-4">
                        {currentScreen.slideTitle ? (
                          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-left">{currentScreen.slideTitle}</h2>
                        ) : null}
                        
                        {currentScreen.showButton ? (
                          <Button
                            variant="ghost"
                            className="text-white mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenNewsModal(currentStory);
                            }}
                          >
                            Leia Mais
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}

                {currentScreenIndex > 0 && currentScreen && (
                  <>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-left">
                      {currentScreen.type === "quote" ? "Citação" : currentScreen.content}
                    </h2>
                    {currentScreen.type === "quote" && currentScreen.quote && (
                      <>
                        <div className="text-4xl mb-4">&quot;</div>
                        <p className="text-xl mb-4 italic text-left">{currentScreen.quote}</p>
                        <p className="text-sm opacity-75 text-left">— {currentScreen.author}</p>
                      </>
                    )}
                    {currentScreen.type !== "quote" && (
                      <>
                        
                        {currentScreen.showButton ? (
                          <Button
                            variant="ghost"
                            className="text-white mt-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenNewsModal(currentStory);
                            }}
                          >
                            Leia Mais
                          </Button>
                        ) : null}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Vertical bullets */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-2">
            {(() => {
              const maxBullets = 5;
              const total = stories.length;
              if (total <= maxBullets) {
                return stories.map((story, index) => (
                  <div
                    key={index}
                    className={`w-2 rounded-full transition-all duration-300 ${index === currentStoryIndex ? "h-6" : "h-2"}`}
                    style={{
                      filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                      backgroundColor: "#ffffff",
                      opacity: index === currentStoryIndex ? 1 : index < currentStoryIndex ? 0.7 : 0.3,
                    }}
                  />
                ));
              } else {
                const startIndex = Math.max(0, Math.min(currentStoryIndex - 2, total - maxBullets));
                return Array.from({ length: maxBullets }, (_, i) => {
                  const storyIndex = startIndex + i;
                  return (
                    <div
                      key={storyIndex}
                      className={`w-2 rounded-full transition-all duration-300 ${storyIndex === currentStoryIndex ? "h-6" : "h-2"}`}
                      style={{
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                        backgroundColor: "#ffffff",
                        opacity: storyIndex === currentStoryIndex ? 1 : storyIndex < currentStoryIndex ? 0.7 : 0.3,
                      }}
                    />
                  );
                });
              }
            })()}
          </div>

          {/* Horizontal bars */}
          <div className="absolute top-4 left-0 right-0 px-4 flex space-x-1 z-40">
            {currentStory.screens.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 flex-1 ${index === currentScreenIndex ? "bg-white" : index < currentScreenIndex ? "bg-white/80" : "bg-white/30"}`}
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
              />
            ))}
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-8 right-4 z-50 text-white border-0 focus:ring-0 focus:ring-offset-0"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Lightweight Stories launcher that fetches WP posts and opens the player
export function Stories() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/posts?first=9", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          items: Array<{
            id: string;
            title: string;
            uri: string;
            image: string | null;
            excerpt?: string | null;
            category: { name: string; slug: string } | null;
            acfScreens?: Array<{
              type?: "text" | "quote";
              content?: string;
              imageUrl?: string;
              quote?: string;
              author?: string;
            }> | null;
          }>;
        };
        if (cancelled) return;
        const mapped: NewsStory[] = json.items.map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: (p.excerpt || "").replace(/<[^>]*>/g, " ").trim(),
          imageUrl: p.image || "",
          category: p.category?.name || "Geral",
          link: `https://portal.commarilia.com${p.uri}`,
          screens:
            p.acfScreens && p.acfScreens.length
              ? p.acfScreens
              : [
                  {
                    type: "text",
                    content: p.title,
                    imageUrl: p.image || undefined,
                  },
                ],
        }));
        setStories(mapped);
      } catch {
        setStories([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grid = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stories.map((s, i) => (
        <button
          key={s.id}
          onClick={() => {
            setIndex(i);
            setOpen(true);
          }}
          className="group relative overflow-hidden rounded-2xl bg-white border hover:shadow-xl transition-all text-left"
        >
          {s.imageUrl ? (
            <img src={s.imageUrl} alt={s.title} className="h-56 w-full object-cover" />
          ) : (
            <div className="h-56 w-full bg-neutral-200" />
          )}
          <div className="p-4">
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full inline-block mb-2 text-white"
              style={{ backgroundColor: categoryHex(s.category) }}
            >
              {s.category}
            </span>
            <h3 className="font-bold leading-snug line-clamp-2">{s.title}</h3>
            {s.subtitle ? (
              <p className="text-sm opacity-70 line-clamp-2 mt-1">{s.subtitle}</p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  ), [stories]);

  if (loading) {
    return (
      <div className="max-w-[990px] mx-auto px-4 py-6">
        <div className="h-8 w-40 bg-neutral-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 bg-neutral-100 rounded-2xl border skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!stories.length) return null;

  return (
    <div className="max-w-[990px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Stories</h2>
        <a
          href="https://portal.commarilia.com/"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Ver mais
        </a>
      </div>
      {grid}
      {open && (
        <StoryPlayer
          stories={stories}
          currentStoryIndex={index}
          onClose={() => setOpen(false)}
          onOpenNewsModal={(story) => {
            const href = story.link || "";
            if (href) window.open(href, "_blank", "noopener,noreferrer");
          }}
          onNext={() => setIndex((p) => Math.min(p + 1, stories.length - 1))}
          onPrevious={() => setIndex((p) => Math.max(p - 1, 0))}
        />
      )}
    </div>
  );
}

export default StoryPlayer;
