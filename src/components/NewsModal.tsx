"use client";

import React, { useEffect } from "react";
import type { NewsStory } from "./StoryPlayer";

function ImageWithFallback({ src, alt, className }: { src?: string | null; alt?: string; className?: string }) {
  const [err, setErr] = React.useState(false);
  const url = err || !src ? "https://images.unsplash.com/photo-1545972152-7051c7c4e9f5?q=80&w=1200&auto=format&fit=crop" : src;
  return <img src={url || undefined} alt={alt || ""} className={className} onError={() => setErr(true)} />;
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Fechar"
      onClick={onClick}
      className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const now = new Date();
  const publishDate = new Date(dateString);
  const diffTime = Math.abs(now.getTime() - publishDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

  if (diffDays <= 7) {
    if (diffDays === 0) {
      if (diffHours === 0) {
        return "postado há poucos minutos";
      } else if (diffHours === 1) {
        return "postado há 1 hora";
      } else {
        return `postado há ${diffHours} horas`;
      }
    } else if (diffDays === 1) {
      return "postado há 1 dia";
    } else {
      return `postado há ${diffDays} dias`;
    }
  } else {
    return publishDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
}

export function NewsModal({ story, isOpen, onClose }: { story: NewsStory | null; isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !story) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative max-w-3xl w-[92%] max-h-[90vh] overflow-y-auto rounded-2xl bg-white text-neutral-900 shadow-2xl">
        <CloseButton onClick={onClose} />

        {/* Header image */}
        <div className="relative h-56 w-full">
          <ImageWithFallback src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Date */}
          <div className="mb-3 text-sm text-neutral-500 flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
            <span>{formatDate(story.publishDate)}</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold leading-tight mb-2 text-neutral-900">{story.title}</h2>
          {story.subtitle ? (
            <p className="text-base mb-5 text-neutral-600">{story.subtitle}</p>
          ) : story.excerpt ? (
            <p className="text-base mb-5 text-neutral-600">{story.excerpt}</p>
          ) : null}

          {/* Content */}
          {story.contentHtml ? (
            <div className="mb-6 text-[15px] leading-7 text-neutral-800 space-y-4">
              <div
                className="[&>p]:mb-4 [&>p:last-child]:mb-0 [&_img]:max-w-full [&_img]:h-auto [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2"
                dangerouslySetInnerHTML={{ __html: story.contentHtml }}
              />
            </div>
          ) : null}

          {/* External Link */}
          {story.link ? (
            <div className="flex justify-center">
              <button
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                onClick={() => window.open(story.link!, "_blank", "noopener,noreferrer")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Ler matéria completa</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default NewsModal;
