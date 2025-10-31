import { useCallback, useMemo } from 'react'
import { useInfiniteQuery } from '@mfestack/react'

// Types for posts
interface Post {
  id: number
  title: string
  body: string
  userId: number
}

interface PostsPage {
  posts: Post[]
  nextPage: number | undefined
}

// Fetch posts with pagination using JSONPlaceholder
const fetchPostsPage = async ({ pageParam = 1 }: { pageParam?: number }): Promise<PostsPage> => {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_page=${pageParam}&_limit=10`
  )
  if (!res.ok) throw new Error(`Failed to fetch posts (${res.status})`)
  const posts: Array<{ id: number; title: string; body: string; userId: number }> = await res.json()
  return {
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body.substring(0, 100) + '...',
      userId: p.userId,
    })),
    nextPage: posts.length === 10 ? (pageParam || 1) + 1 : undefined,
  }
}

export function InfiniteQueryDemo() {
  const queryFn = useCallback(fetchPostsPage, [])
  const queryKey = useMemo(() => ['posts', 'infinite'] as const, [])

  const {
    data,
    error,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<PostsPage, Error, PostsPage>({
    queryKey,
    queryFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage: PostsPage) => lastPage.nextPage,
  })

  // Flatten all pages into a single array of posts
  const allPosts = useMemo(() => {
    return data?.flatMap((page: PostsPage) => page.posts) ?? []
  }, [data])

  return (
    <div className="demo-grid">
      <div className="demo-card">
        <h3>♾️ Infinite Scrolling Posts</h3>
        <p>
          Load posts page by page. Each page contains 10 posts. Click "Load More" to fetch the next page.
        </p>

        <div className="status loading" style={{ display: isLoading ? 'block' : 'none' }}>
          ⏳ Loading first page...
        </div>

        <div className="status error" style={{ display: error ? 'block' : 'none' }}>
          ❌ Error: {error?.message || 'Unknown error'}
        </div>

        {allPosts.length > 0 && (
          <div className="posts-list">
            <div className="posts-header">
              <strong>Total Posts Loaded: {allPosts.length}</strong>
            </div>
            <div className="posts-container">
              {allPosts.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="post-header">
                    <span className="post-id">#{post.id}</span>
                    <span className="post-user">User {post.userId}</span>
                  </div>
                  <h4 className="post-title">{post.title}</h4>
                  <p className="post-body">{post.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="button primary"
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetching}
        >
          {isFetching
            ? 'Loading...'
            : hasNextPage
              ? 'Load More Posts'
              : 'No More Posts'}
        </button>

        {!hasNextPage && allPosts.length > 0 && (
          <div className="status success">
            ✅ All posts loaded! You've reached the end.
          </div>
        )}
      </div>
    </div>
  )
}

