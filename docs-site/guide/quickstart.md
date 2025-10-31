# Quick Start

Get started with MFestack Query in minutes.

## Installation

Install the core package and your framework adapter:

```bash
npm install @mfestack/core @mfestack/react
# or
pnpm add @mfestack/core @mfestack/react
# or
yarn add @mfestack/core @mfestack/react
```

## React Setup

### 1. Create a QueryClient

```tsx
import { QueryClient } from '@mfestack/core'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
})
```

### 2. Provide the QueryClient

```tsx
import { QueryClientProvider } from '@mfestack/react'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

### 3. Use Queries

```tsx
import { useQuery } from '@mfestack/react'

function Posts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### 4. Use Mutations

```tsx
import { useMutation, useQueryClient } from '@mfestack/react'

function CreatePost() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: async (newPost: { title: string; body: string }) => {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      })
      return res.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <button
      onClick={() => mutation.mutate({ title: 'New Post', body: '...' })}
      disabled={mutation.isLoading}
    >
      {mutation.isLoading ? 'Creating...' : 'Create Post'}
    </button>
  )
}
```

## Next Steps

- Learn about [Queries](/guide/queries) in detail
- Explore [Mutations](/guide/mutations)
- Check out [Recipes](/recipes/) for common patterns
- Read the [API Reference](/api/)

