# Dependent Queries

Execute queries that depend on data from other queries.

## Basic Dependent Query

Wait for one query before starting another:

```tsx
function UserPosts({ userId }: { userId: string }) {
  // First query: Fetch user
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  // Second query: Depends on user
  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchUserPosts(user.id),
    enabled: !!user?.id, // Only run when user exists
  })

  if (!user) return <div>Loading user...</div>
  if (!posts) return <div>Loading posts...</div>

  return (
    <div>
      <h1>{user.name}'s Posts</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Multiple Dependencies

Chain multiple dependent queries:

```tsx
function UserPostsComments({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchUserPosts(user.id),
    enabled: !!user?.id,
  })

  const { data: comments } = useQuery({
    queryKey: ['comments', posts?.[0]?.id],
    queryFn: () => fetchPostComments(posts[0].id),
    enabled: !!posts?.[0]?.id,
  })

  // Render UI...
}
```

## Conditional Enabled Logic

Use complex conditions for `enabled`:

```tsx
const { data: posts } = useQuery({
  queryKey: ['posts', user?.id],
  queryFn: () => fetchUserPosts(user.id),
  enabled: !!user?.id && user?.role === 'admin', // Only for admins
})
```

