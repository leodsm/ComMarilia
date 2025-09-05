// app/page.tsx ou pages/index.tsx
import { request, gql } from "graphql-request";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL!;

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

export default async function Home() {
  const data = await request(API_URL, query);
  const posts = data.posts.nodes;

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>Lista de Posts</h1>
      <ul>
        {posts.map((post: any) => (
          <li key={post.id}>
            <h2 dangerouslySetInnerHTML={{ __html: post.title }} />
            <div dangerouslySetInnerHTML={{ __html: post.excerpt }} />
          </li>
        ))}
      </ul>
    </main>
  );
}
