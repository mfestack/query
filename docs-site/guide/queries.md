# Queries

Queries are the foundation of MFestack Query. They fetch and cache data.

## Basic Query

```tsx
import { useQuery } from '@mfestack/react'

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  // Your component logic
}
```

## Query States

A query can be in one of several states:

- `status: 'idle'` - Query hasn't executed yet
- `status: 'loading'` - Query is fetching for the first time
- `status: 'error'` - Query encountered an error
- `status: 'success'` - Query succeeded

```tsx
const { data, status, error } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

if (status === 'loading') return <Spinner />
if (status === 'error') return <Error message={error.message} />
if (status === 'success') return <PostsList data={data} />
```

## Query Options

### enabled

Control when queries execute:

```tsx
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId, // Only fetch when userId exists
})
```

### staleTime

Time before data is considered stale:

```tsx
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

### gcTime (formerly cacheTime)

Time before unused data is garbage collected:

```tsx
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  gcTime: 10 * 60 * 1000, // 10 minutes
})
```

### refetchOnWindowFocus

Refetch when window regains focus:

```tsx
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  refetchOnWindowFocus: true, // default
})
```

### retry

Configure retry behavior:

```tsx
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  retry: 3, // Retry 3 times on failure
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

## Manual Refetch

```tsx
const { data, refetch } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

return <button onClick={() => refetch()}>Refresh</button>
```

## Dependent Queries

Wait for one query before starting another:

```tsx
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
})

const { data: posts } = useQuery({
  queryKey: ['posts', user?.id],
  queryFn: () => fetchUserPosts(user.id),
  enabled: !!user?.id, // Only run when user exists
})
```

## Selecting Data

Transform data with `select`:

```tsx
const { data: userName } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  select: (user) => user.name, // Only subscribe to name changes
})
```

