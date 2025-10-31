import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { getQueryClient, prefetchQuery, getDehydratedState, fetchUser } from "../lib/utils";
import { UserDemo } from "../components/UserDemo";
import { PostsDemo } from "../components/PostsDemo";

export async function loader(_args: LoaderFunctionArgs) {
  // Create a QueryClient instance for this request
  const queryClient = getQueryClient();
  
  // Prefetch data on the server
  await prefetchQuery(queryClient, ['user', '1'], () => fetchUser('1'));
  
  // Dehydrate the query client state
  const dehydratedState = getDehydratedState(queryClient);
  
  // Return the dehydrated state to be serialized to the client
  return json({ dehydratedState });
}

export default function Index() {
  return (
    <main style={{ minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          🚀 MFestack Query - Remix SSR Demo
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#666", marginBottom: "2rem" }}>
          This demo shows server-side prefetching, dehydration, and client hydration with MFestack Query in Remix.
        </p>

        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>👤 User Query (SSR)</h2>
            <p style={{ color: "#666", marginBottom: "1rem" }}>
              This data was prefetched on the server and hydrated on the client.
            </p>
            <UserDemo userId="1" />
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>📝 Posts Query (SSR)</h2>
            <p style={{ color: "#666", marginBottom: "1rem" }}>
              Dependent query that fetches after user data is loaded.
            </p>
            <PostsDemo userId="1" />
          </div>
        </div>

        <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>✨ Features Demonstrated</h3>
          <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", color: "#374151" }}>
            <li>Server-side prefetching with Remix loaders</li>
            <li>Dehydration of query cache on the server</li>
            <li>Client-side hydration for instant data display</li>
            <li>No refetch on initial client render (uses hydrated data)</li>
            <li>Automatic refetch on window focus (if stale)</li>
          </ul>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          {/* @ts-ignore - Remix Link type compatibility with React 18/19 */}
          <Link 
            to="/about"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            → View About Page (Different Route)
          </Link>
        </div>
      </div>
    </main>
  );
}
