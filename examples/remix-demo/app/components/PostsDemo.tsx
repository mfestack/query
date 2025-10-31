import { useQuery } from '@mfestack/react'
import { fetchPosts } from '../lib/utils'

interface PostsDemoProps {
  userId: string
}

export function PostsDemo({ userId }: PostsDemoProps) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetchPosts(userId),
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return <div style={{ color: "#666" }}>Loading posts...</div>
  }

  if (error) {
    return <div style={{ color: "#dc2626" }}>Error: {error.message}</div>
  }

  if (!data || data.length === 0) {
    return <div style={{ color: "#666" }}>No posts found</div>
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {isFetching && <span style={{ fontSize: "0.875rem", color: "#2563eb" }}>🔄 Refetching...</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "24rem", overflowY: "auto" }}>
        {data.map((post) => (
          <div key={post.id} style={{ backgroundColor: "#fff", padding: "0.75rem", borderRadius: "0.25rem", border: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: "600", fontSize: "0.875rem" }}>{post.title}</div>
            <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {post.body}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.5rem" }}>
        Showing {data.length} posts • {isLoading ? 'Loading...' : 'From server'}
      </div>
    </div>
  )
}

