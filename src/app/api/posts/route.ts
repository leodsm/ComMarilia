import { NextRequest } from "next/server";
import { gqlFetch } from "@/lib/graphql";

type WPMediaLike =
  | { sourceUrl?: string | null; mediaItemUrl?: string | null }
  | { nodes?: Array<{ sourceUrl?: string | null; mediaItemUrl?: string | null }> }
  | { edges?: Array<{ node?: { sourceUrl?: string | null; mediaItemUrl?: string | null } }> }
  | Array<{ sourceUrl?: string | null; mediaItemUrl?: string | null }>
  | string
  | null
  | undefined;

type WPPost = {
  id: string;
  title: string;
  date: string;
  uri: string;
  excerpt?: string | null;
  content?: string | null;
  categories?: { nodes: Array<{ name: string; slug: string }> } | null;
  featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
  storiesSimples?: {
    stories?: Array<{
      type?: string | null;
      title?: string | null;
      text?: string | null;
      showButton?: boolean | number | null;
      media?: WPMediaLike;
    }> | null;
  } | null;
};

type WPPostsData = {
  posts: {
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    nodes: WPPost[];
  };
};

// --- Utils ---
function stripHtml(html?: string | null): string {
  if (!html) return "";
  const noTags = html.replace(/<[^>]*>/g, " ");
  return noTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Aceita vários formatos de `media` (objeto único, array, nodes/edges, string) e retorna a melhor URL. */
function pickMediaUrl(media: WPMediaLike): string | undefined {
  if (!media) return undefined;

  // string direta
  if (typeof media === "string") return media || undefined;

  // array de medias
  if (Array.isArray(media)) {
    for (const m of media) {
      if (m?.sourceUrl) return m.sourceUrl;
      if (m?.mediaItemUrl) return m.mediaItemUrl || undefined;
    }
    return undefined;
  }

  // objeto simples
  const obj = media as any;
  if (typeof obj.sourceUrl === "string" && obj.sourceUrl) return obj.sourceUrl;
  if (typeof obj.mediaItemUrl === "string" && obj.mediaItemUrl) return obj.mediaItemUrl;

  // nodes
  if (Array.isArray(obj.nodes) && obj.nodes.length) {
    const n = obj.nodes[0];
    if (n?.sourceUrl) return n.sourceUrl;
    if (n?.mediaItemUrl) return n.mediaItemUrl;
  }

  // edges
  if (Array.isArray(obj.edges) && obj.edges.length) {
    const n = obj.edges[0]?.node;
    if (n?.sourceUrl) return n.sourceUrl;
    if (n?.mediaItemUrl) return n.mediaItemUrl;
  }

  return undefined;
}

/** Normaliza o type dos slides do ACF para o que o player entende hoje. */
function normalizeSlideType(t?: string | null): "text" | "quote" {
  const k = (t || "").toLowerCase();
  if (k === "quote") return "quote";
  // "image" e "video" também caem em "text" (usando imageUrl)
  return "text";
}

// --- Queries ---
const queryWithAcf = /* GraphQL */ `
  query Posts($first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      pageInfo { endCursor hasNextPage }
      nodes {
        id
        title
        date
        uri
        excerpt
        content
        categories { nodes { name slug } }
        featuredImage { node { sourceUrl } }
        storiesSimples {
          stories {
            type
            title
            text
            showButton
            # Deixa genérico o suficiente para cobrir diferentes tipos de campo ACF:
            media {
              ... on MediaItem {
                sourceUrl
                mediaItemUrl
              }
              ... on MediaItemConnection {
                nodes { sourceUrl mediaItemUrl }
                edges { node { sourceUrl mediaItemUrl } }
              }
            }
          }
        }
      }
    }
  }
`;

const queryBase = /* GraphQL */ `
  query PostsBase($first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      pageInfo { endCursor hasNextPage }
      nodes {
        id
        title
        date
        uri
        excerpt
        content
        categories { nodes { name slug } }
        featuredImage { node { sourceUrl } }
      }
    }
  }
`;

// --- Handler ---
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const first = Math.min(parseInt(searchParams.get("first") || "9", 10) || 9, 24);
  const after = searchParams.get("after");

  try {
    let data: WPPostsData;
    try {
      data = await gqlFetch<WPPostsData>(queryWithAcf, { first, after }, 60);
    } catch {
      data = await gqlFetch<WPPostsData>(queryBase, { first, after }, 60);
    }

    const items = data.posts.nodes.map((p) => {
      const text = stripHtml(p.content ?? p.excerpt ?? "");
      const readingMinutes = estimateReadingTime(text);
      const primaryCat = p.categories?.nodes?.[0];
      const cleanExcerpt = stripHtml(p.excerpt || "");
      const dot = cleanExcerpt.indexOf(".");
      const excerpt = dot === -1 ? cleanExcerpt : cleanExcerpt.slice(0, dot + 1).trim();

      // --- SLIDE DE CAPA ---
      const coverUrl = p.featuredImage?.node?.sourceUrl || undefined;
      const screens: Array<{ type: "text" | "quote"; content?: string | null; imageUrl?: string | null; quote?: string | null; author?: string | null; }> = [
        {
          type: "text",
          content: stripHtml(p.title),
          imageUrl: coverUrl || null,
        },
      ];

      // --- SLIDES DO ACF -> SCREENS ---
      const acfScreens = Array.isArray(p.storiesSimples?.stories)
        ? p.storiesSimples!.stories!.map((s) => {
            const mediaUrl = pickMediaUrl(s?.media);
            const t = normalizeSlideType(s?.type);
            if (t === "quote") {
              // quote prioriza texto no campo quote; mantém imagem se houver
              return {
                type: "quote" as const,
                quote: (s?.text || s?.title || "")?.toString().trim() || null,
                author: null,
                imageUrl: mediaUrl || null,
              };
            }
            // text: usa texto ou título; imagem opcional
            return {
              type: "text" as const,
              content: (s?.text || s?.title || "")?.toString().trim() || "",
              imageUrl: mediaUrl || null,
            };
          })
        : null;

      if (acfScreens && acfScreens.length) {
        screens.push(...acfScreens);
      }

      return {
        id: p.id,
        title: p.title,
        date: p.date,
        uri: p.uri,
        category: primaryCat ? { name: primaryCat.name, slug: primaryCat.slug } : null,
        image: p.featuredImage?.node?.sourceUrl || null,
        readingTimeMin: readingMinutes,
        excerpt,
        contentHtml: p.content || null,

        // Para compat com código antigo que lia acfScreens:
        acfScreens: acfScreens && acfScreens.length ? acfScreens : null,

        // Novo campo já pronto pro Player:
        screens,
      };
    });

    return Response.json({
      items,
      pageInfo: data.posts.pageInfo,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load posts";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
