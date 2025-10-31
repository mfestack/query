'use client'

import { useQuery } from '@mfestack/react'
import { fetchPosts } from '../../lib/utils'

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
    return <div className="text-gray-500">Loading posts...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>
  }

  if (!data || data.length === 0) {
    return <div className="text-gray-500">No posts found</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isFetching && <span className="text-sm text-blue-500">🔄 Refetching...</span>}
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {data.map((post) => (
          <div key={post.id} className="bg-white p-3 rounded border">
            <div className="font-semibold text-sm">{post.title}</div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {post.body}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-2">
        Showing {data.length} posts • {isLoading ? 'Loading...' : 'From server'}
      </div>
    </div>
  )
}

