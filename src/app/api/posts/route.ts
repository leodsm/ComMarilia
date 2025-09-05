import { NextRequest } from "next/server";
import { gqlFetch } from "@/lib/graphql";

type WPPost = {
  id: string;
  title: string;
  date: string;
  uri: string;
  excerpt?: string | null;
  content?: string | null;
  categories?: { nodes: Array<{ name: string; slug: string }> } | null;
  featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
};

type WPPostsData = {
  posts: {
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    nodes: WPPost[];
  };
};

function stripHtml(html?: string | null): string {
  if (!html) return "";
  // remove HTML tags
  const noTags = html.replace(/<[^>]*>/g, " ");
  // decode a few common entities without extra deps
  return noTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const first = Math.min(parseInt(searchParams.get("first") || "9", 10) || 9, 24);
  const after = searchParams.get("after");

  const query = /* GraphQL */ `
    query Posts($first: Int!, $after: String) {
      posts(first: $first, after: $after, where: { status: PUBLISH }) {
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

  try {
    const data = await gqlFetch<WPPostsData>(query, { first, after }, 60);

    const items = data.posts.nodes.map((p) => {
      const text = stripHtml(p.content ?? p.excerpt ?? "");
      const readingMinutes = estimateReadingTime(text);
      const primaryCat = p.categories?.nodes?.[0];
      const cleanExcerpt = stripHtml(p.excerpt || "");
      const excerpt = cleanExcerpt.length > 160 ? `${cleanExcerpt.slice(0, 157)}...` : cleanExcerpt;
      return {
        id: p.id,
        title: p.title,
        date: p.date,
        uri: p.uri,
        category: primaryCat ? { name: primaryCat.name, slug: primaryCat.slug } : null,
        image: p.featuredImage?.node?.sourceUrl || null,
        readingTimeMin: readingMinutes,
        excerpt,
      };
    });

    return Response.json({
      items,
      pageInfo: data.posts.pageInfo,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to load posts";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
