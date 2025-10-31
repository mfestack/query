# Basic Usage

Learn the fundamentals of MFestack Query.

## QueryClient

The `QueryClient` is the central hub for managing queries and mutations.

```tsx
import { QueryClient } from '@mfestack/core'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})
```

## useQuery

Fetch data with `useQuery`:

```tsx
import { useQuery } from '@mfestack/react'

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{data?.name}</div>
}
```

## useMutation

Perform mutations with `useMutation`:

```tsx
import { useMutation } from '@mfestack/react'

function CreatePost() {
  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      console.log('Post created!')
    },
  })

  return (
    <button onClick={() => mutation.mutate({ title: 'Hello' })}>
      Create Post
    </button>
  )
}
```

## Query Keys

Query keys uniquely identify queries. Use arrays for hierarchical keys:

```tsx
// Single key
['posts']

// Parameterized
['post', postId]

// Nested
['users', userId, 'posts']
```

## Query Functions

Query functions are async functions that return data:

```tsx
async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}
```

