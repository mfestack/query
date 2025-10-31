import { useQuery } from '@mfestack/react'
import { fetchUser } from '../lib/utils'

interface UserDemoProps {
  userId: string
}

export function UserDemo({ userId }: UserDemoProps) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 60 * 1000, // 1 minute
  })

  if (isLoading) {
    return <div style={{ color: "#666" }}>Loading user...</div>
  }

  if (error) {
    return <div style={{ color: "#dc2626" }}>Error: {error.message}</div>
  }

  if (!data) {
    return <div style={{ color: "#666" }}>No user data</div>
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {isFetching && <span style={{ fontSize: "0.875rem", color: "#2563eb" }}>🔄 Refetching...</span>}
      </div>
      <div style={{ backgroundColor: "#fff", padding: "1rem", borderRadius: "0.25rem", border: "1px solid #e5e7eb" }}>
        <div style={{ fontWeight: "600", fontSize: "1.125rem" }}>{data.name}</div>
        <div style={{ fontSize: "0.875rem", color: "#666" }}>{data.email}</div>
        <div style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.5rem" }}>
          <div>Company: {data.company}</div>
          <div>City: {data.city}</div>
        </div>
      </div>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.5rem" }}>
        {isLoading ? '⏳ Client loading...' : '✅ Hydrated from server (no refetch!)'}
      </div>
    </div>
  )
}

