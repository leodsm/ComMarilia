// src/app/page.tsx
import { request, gql } from "graphql-request";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL!; // ex.: https://portal.commarilia.com/graphql

// 1) Defina tipos simples e suficientes para agora
type Post = {
  id: string;
  title: string;   // normalmente vem com HTML
  excerpt: string; // idem
};

type PostsResponse = {
  posts: {
    nodes: Post[];
  };
};

// 2) Query bem básica
const query = gql`
  {
    posts(first: 10) {
      nodes {
        id
        title
        excerpt
      }
    }
  }
`;

// 3) Server Component (App Router) — sem client-side e sem suspense
export default async function Home() {
  // Tipamos a resposta aqui: nada de `any`
  const data = await request<PostsResponse>(API_URL, query);
  const posts: Post[] = data.posts.nodes;

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>Lista de Posts</h1>

      <ul style={{ display: "grid", gap: "1.25rem", listStyle: "none", padding: 0 }}>
        {posts.map((post) => (
          <li key={post.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
            <h2
              style={{ margin: "0 0 .5rem 0", fontSize: "1.25rem" }}
              dangerouslySetInnerHTML={{ __html: post.title }}
            />
            <div
              style={{ color: "#444" }}
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
