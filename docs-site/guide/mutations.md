# Mutations

Mutations are for creating, updating, or deleting data.

## Basic Mutation

```tsx
import { useMutation } from '@mfestack/react'

function CreatePost() {
  const mutation = useMutation({
    mutationFn: (newPost: Post) => {
      return fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      }).then(res => res.json())
    },
  })

  return (
    <button
      onClick={() => mutation.mutate({ title: 'Hello', body: 'World' })}
      disabled={mutation.isLoading}
    >
      {mutation.isLoading ? 'Creating...' : 'Create Post'}
    </button>
  )
}
```

## Mutation States

```tsx
const {
  data,
  error,
  isIdle,
  isLoading,
  isSuccess,
  isError,
  status,
} = useMutation({
  mutationFn: createPost,
})

if (isLoading) return <div>Creating post...</div>
if (isError) return <div>Error: {error.message}</div>
if (isSuccess) return <div>Post created: {data.id}</div>
```

## Mutation Callbacks

Handle side effects with callbacks:

```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: (data) => {
    console.log('Post created:', data.id)
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  },
  onError: (error) => {
    console.error('Failed to create post:', error)
  },
  onSettled: () => {
    // Always runs after success or error
    console.log('Mutation completed')
  },
})
```

## Invalidate Queries

Update cache after mutation:

```tsx
import { useQueryClient } from '@mfestack/react'

function CreatePost() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return <button onClick={() => mutation.mutate({...})}>Create</button>
}
```

## Optimistic Updates

See [Optimistic Updates Recipe](/recipes/optimistic-updates) for detailed examples.

