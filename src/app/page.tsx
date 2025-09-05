import Image from "next/image";
import Link from "next/link";
import { gqlFetch } from "@/lib/graphql";

export const revalidate = 60; // revalidate homepage every 60s on Vercel

type Post = {
  id: string;
  title: string;
  date: string;
  uri: string;
  excerpt: string;
  featuredImage?: { node?: { sourceUrl?: string } } | null;
};

type PostsData = {
  posts: { nodes: Post[] };
};

const PORTAL_ORIGIN = "https://portal.commarilia.com";

async function getPosts(): Promise<Post[]> {
  const query = /* GraphQL */ `
    query HomePosts($first: Int = 10) {
      posts(first: $first) {
        nodes {
          id
          title
          date
          uri
          excerpt
          featuredImage { node { sourceUrl } }
        }
      }
    }
  `;

  const data = await gqlFetch<PostsData>(query, { first: 10 }, 60);
  return data.posts.nodes;
}

export default async function Home() {
  let posts: Post[] = [];
  try {
    posts = await getPosts();
  } catch (e) {
    // Fallback: keep page minimal even if API fails
    console.error("Erro ao carregar posts:", e);
  }

  if (!posts.length) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-4">Últimas notícias</h1>
        <p className="text-sm opacity-70">Nenhum post disponível no momento.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Últimas notícias</h1>
      <ul className="space-y-8">
        {posts.map((post) => {
          const img = post.featuredImage?.node?.sourceUrl || null;
          const href = `${PORTAL_ORIGIN}${post.uri}`;
          const date = new Date(post.date);
          const dateStr = isNaN(date.getTime())
            ? post.date
            : date.toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "2-digit" });

          return (
            <li key={post.id} className="border-b border-black/10 dark:border-white/15 pb-6">
              <article>
                <header className="mb-3">
                  <h2 className="text-xl font-medium leading-snug">
                    <Link href={href} target="_blank" className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-xs opacity-60 mt-1">{dateStr}</p>
                </header>
                {img ? (
                  <div className="mb-3">
                    <Image
                      src={img}
                      alt="Imagem de destaque"
                      width={800}
                      height={420}
                      className="w-full h-auto rounded"
                    />
                  </div>
                ) : null}
                {post.excerpt ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none opacity-90"
                    dangerouslySetInnerHTML={{ __html: post.excerpt }}
                  />
                ) : null}
                <div className="mt-3">
                  <Link href={href} target="_blank" className="text-sm font-medium hover:underline">
                    Ler no portal →
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      <div className="mt-10">
        <Link
          href={PORTAL_ORIGIN}
          target="_blank"
          className="inline-block rounded border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Ver mais no portal
        </Link>
      </div>
    </main>
  );
}
