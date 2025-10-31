import { QueryClient, dehydrate } from '@mfestack/core'
import type { QueryKey } from '@mfestack/core'
import { getQueryClient as getCachedQueryClient } from './getQueryClient'

// Re-export getQueryClient
export { getQueryClient } from './getQueryClient'

// Helper function to prefetch queries on the server
export async function prefetchQuery<TData = unknown>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  queryFn: () => Promise<TData>
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
  } as any)
}

// Helper function to get dehydrated state
export function getDehydratedState(queryClient: QueryClient) {
  return dehydrate(queryClient)
}

// Fetch functions for the demo
export async function fetchUser(userId: string) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${encodeURIComponent(userId)}`, {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  })
  if (!res.ok) throw new Error(`Failed to fetch user (${res.status})`)
  const u = await res.json()
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    username: u.username,
    company: u.company?.name ?? 'Unknown',
    city: u.address?.city ?? 'Unknown',
  }
}

export async function fetchPosts(userId: string) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${encodeURIComponent(userId)}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Failed to fetch posts (${res.status})`)
  const items: Array<{ id: number; title: string; body: string }> = await res.json()
  return items.slice(0, 5).map(p => ({
    id: p.id,
    title: p.title,
    body: p.body,
  }))
}

