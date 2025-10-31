# useQuery Hook

React hook for fetching and caching data.

## Basic Usage

```tsx
import { useQuery } from '@mfestack/react'

function Posts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(res => res.json()),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <ul>{data?.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `queryKey` | `QueryKey` | **Required** | Unique identifier for the query |
| `queryFn` | `QueryFunction` | **Required** | Function that returns a promise |
| `enabled` | `boolean` | `true` | Whether the query should execute |
| `staleTime` | `number` | `0` | Time before data is considered stale (ms) |
| `gcTime` | `number` | `5 * 60 * 1000` | Time before unused data is garbage collected (ms) |
| `refetchOnWindowFocus` | `boolean` | `true` | Refetch when window regains focus |
| `retry` | `number \| boolean` | `3` | Number of retry attempts |
| `select` | `function` | - | Transform the data |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `data` | `TData \| undefined` | The query data |
| `error` | `Error \| null` | The error object |
| `isLoading` | `boolean` | True if first fetch is in progress |
| `isFetching` | `boolean` | True if any fetch is in progress |
| `isError` | `boolean` | True if query has errored |
| `isSuccess` | `boolean` | True if query has succeeded |
| `status` | `string` | `'idle' \| 'loading' \| 'error' \| 'success'` |
| `refetch` | `function` | Function to manually refetch |

## Examples

### Conditional Queries

```tsx
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId, // Only fetch if userId exists
})
```

### Transforming Data

```tsx
const { data: userName } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  select: (user) => user.name, // Only subscribe to name
})
```

