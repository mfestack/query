import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { getQueryClient, prefetchQuery, getDehydratedState, fetchUser } from "../lib/utils";
import { UserDemo } from "../components/UserDemo";

export async function loader(_args: LoaderFunctionArgs) {
  const queryClient = getQueryClient();
  
  // Prefetch different data for this route
  await prefetchQuery(queryClient, ['user', '2'], () => fetchUser('2'));
  
  const dehydratedState = getDehydratedState(queryClient);
  
  return json({ dehydratedState });
}

export default function About() {
  return (
    <main style={{ minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          {/* @ts-ignore - Remix Link type compatibility with React 18/19 */}
          <Link to="/" style={{ color: "#2563eb", textDecoration: "underline" }}>
            ← Back to Home
          </Link>
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>About Page</h1>
        <p style={{ fontSize: "1.125rem", color: "#666", marginBottom: "2rem" }}>
          This page demonstrates route-level data prefetching. The user data was prefetched on the server.
        </p>
        
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>👤 User 2 (Different from Home)</h2>
          <UserDemo userId="2" />
        </div>
      </div>
    </main>
  );
}
