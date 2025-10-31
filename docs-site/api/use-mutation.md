# useMutation Hook

React hook for creating, updating, or deleting data.

## Basic Usage

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

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mutationFn` | `MutationFunction` | **Required** | Function that performs the mutation |
| `onSuccess` | `function` | - | Called on successful mutation |
| `onError` | `function` | - | Called on failed mutation |
| `onSettled` | `function` | - | Called after mutation completes (success or error) |
| `retry` | `number \| boolean` | `0` | Number of retry attempts |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `mutate` | `function` | Function to trigger the mutation |
| `mutateAsync` | `function` | Async version of mutate |
| `data` | `TData \| undefined` | The mutation result |
| `error` | `Error \| null` | The error object |
| `isIdle` | `boolean` | True if mutation hasn't been called |
| `isLoading` | `boolean` | True if mutation is in progress |
| `isSuccess` | `boolean` | True if mutation succeeded |
| `isError` | `boolean` | True if mutation errored |
| `status` | `string` | `'idle' \| 'loading' \| 'error' \| 'success'` |
| `reset` | `function` | Reset mutation state |

## Examples

### With Callbacks

```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: (data) => {
    console.log('Post created:', data.id)
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  },
  onError: (error) => {
    console.error('Error:', error)
  },
})
```

### Async Mutation

```tsx
const mutation = useMutation({
  mutationFn: createPost,
})

const handleSubmit = async () => {
  try {
    const data = await mutation.mutateAsync({ title: 'Hello' })
    console.log('Created:', data.id)
  } catch (error) {
    console.error('Failed:', error)
  }
}
```

