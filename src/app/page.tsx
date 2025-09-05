import { gqlFetch } from "@/lib/graphql";
import { PostsGrid } from "@/components/PostsGrid";
import type { PostCardData } from "@/components/PostCard";

export const revalidate = 60;

type WPPost = {
  id: string;
  title: string;
  date: string;
  uri: string;
  content?: string | null;
  excerpt?: string | null;
  categories?: { nodes: Array<{ name: string; slug: string }> } | null;
  featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
};

type WPPostsData = {
  posts: {
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    nodes: WPPost[];
  };
};

async function getInitial(): Promise<{ items: PostCardData[]; pageInfo: { endCursor: string | null; hasNextPage: boolean } }>
{
  const query = /* GraphQL */ `
    query HomeInitial($first: Int = 9) {
      posts(first: $first, where: { status: PUBLISH }) {
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
  const data = await gqlFetch<WPPostsData>(query, { first: 9 }, 60);
  const items: PostCardData[] = data.posts.nodes.map((p) => {
    const text = (p.content || p.excerpt || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.max(1, Math.round(words / 200));
    return {
      id: p.id,
      title: p.title,
      date: p.date,
      uri: p.uri,
      category: p.categories?.nodes?.[0] || null,
      image: p.featuredImage?.node?.sourceUrl || null,
      readingTimeMin,
    };
  });
  return { items, pageInfo: data.posts.pageInfo };
}

export default async function Home() {
  let initial: { items: PostCardData[]; pageInfo: { endCursor: string | null; hasNextPage: boolean } } = {
    items: [],
    pageInfo: { endCursor: null, hasNextPage: false },
  };
  try {
    initial = await getInitial();
  } catch {
    // keep minimal render on error
  }

  return <PostsGrid initialItems={initial.items} initialPageInfo={initial.pageInfo} />;
}
