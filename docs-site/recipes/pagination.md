# Pagination

Implement pagination with `useInfiniteQuery` or manual pagination.

## Infinite Query (Recommended)

For infinite scrolling or "Load More" patterns:

```tsx
import { useInfiniteQuery } from '@mfestack/react'

function InfinitePosts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 0 }) => 
      fetch(`/api/posts?page=${pageParam}`).then(res => res.json()),
    getNextPageParam: (lastPage, pages) => 
      lastPage.hasMore ? pages.length : undefined,
    initialPageParam: 0,
  })

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map(post => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

## Manual Pagination

For page numbers or offset-based pagination:

```tsx
import { useState } from 'react'
import { useQuery } from '@mfestack/react'

function PaginatedPosts() {
  const [page, setPage] = useState(0)
  
  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetch(`/api/posts?page=${page}`).then(res => res.json()),
    keepPreviousData: true, // Keep previous page data while loading
  })

  return (
    <div>
      {data?.posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
      <div>
        <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!data?.hasMore}>
          Next
        </button>
      </div>
    </div>
  )
}
```

