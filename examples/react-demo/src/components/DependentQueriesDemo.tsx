import { useQuery } from '@mfestack/react'

/**
 * Example: Dependent Queries
 * 
 * This demonstrates how to use the result of one query
 * to fetch data for another query. The second query only
 * runs when the first query succeeds.
 */

interface User {
  id: number
  name: string
  email: string
}

interface Post {
  id: number
  userId: number
  title: string
  body: string
}

export function DependentQueriesDemo() {
  // First query: Fetch user
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ['user', 1],
    queryFn: async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/users/1')
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
  })

  // Second query: Fetch user's posts (depends on user.id)
  const {
    data: posts,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery<Post[]>({
    queryKey: ['posts', user?.id],
    queryFn: async () => {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/posts?userId=${user!.id}`
      )
      if (!res.ok) throw new Error('Failed to fetch posts')
      return res.json()
    },
    enabled: !!user?.id, // Only fetch when user is available
  })

  if (isLoadingUser) {
    return <div className="status loading">Loading user...</div>
  }

  if (userError) {
    return (
      <div className="status error">
        Error loading user: {userError.message}
      </div>
    )
  }

  return (
    <div className="demo-grid">
      <div className="demo-card">
        <h3>🔗 Dependent Queries</h3>
        <p>
          The posts query depends on the user query. It only runs when the user
          is successfully fetched.
        </p>

        {user && (
          <div style={{ marginBottom: '16px' }}>
            <h4>User:</h4>
            <div>
              <strong>{user.name}</strong> ({user.email})
            </div>
          </div>
        )}

        {isLoadingPosts && (
          <div className="status loading">Loading posts...</div>
        )}

        {postsError && (
          <div className="status error">
            Error loading posts: {postsError.message}
          </div>
        )}

        {posts && posts.length > 0 && (
          <div>
            <h4>Posts ({posts.length}):</h4>
            <ul style={{ textAlign: 'left' }}>
              {posts.map((post) => (
                <li key={post.id}>
                  <strong>{post.title}</strong>
                  <p style={{ fontSize: '0.9em', color: '#666' }}>
                    {post.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

