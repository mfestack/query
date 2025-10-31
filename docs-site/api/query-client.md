# QueryClient API

The `QueryClient` is the central hub for managing queries and mutations.

## Creating a QueryClient

```tsx
import { QueryClient } from '@mfestack/core'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
})
```

## Methods

### setQueryData

Set query data directly:

```tsx
queryClient.setQueryData(['user', userId], { id: userId, name: 'John' })
```

### getQueryData

Get query data:

```tsx
const user = queryClient.getQueryData(['user', userId])
```

### invalidateQueries

Invalidate queries to trigger refetch:

```tsx
await queryClient.invalidateQueries({ queryKey: ['posts'] })
```

### refetchQueries

Refetch queries:

```tsx
await queryClient.refetchQueries({ queryKey: ['posts'] })
```

### removeQueries

Remove queries from cache:

```tsx
queryClient.removeQueries({ queryKey: ['posts'] })
```

### clear

Clear all queries and mutations:

```tsx
queryClient.clear()
```

## Default Options

Configure defaults for all queries:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

