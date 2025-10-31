# @mfestack/react

React adapter for MFestack Query.

## Installation

```bash
pnpm add @mfestack/react @mfestack/core
```

## Quick start

```tsx
import { QueryClient } from '@mfestack/core'
import { QueryClientProvider, useQuery } from '@mfestack/react'

const client = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={client}>
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: async () => fetch('/api/todos').then(r => r.json()),
  })
  if (query.isLoading) return <div>Loading…</div>
  if (query.error) return <div>Error</div>
  return <pre>{JSON.stringify(query.data, null, 2)}</pre>
}
```

## Features
- useQuery, useMutation, useInfiniteQuery
- Suspense, keepPreviousData
- Refetch on focus/reconnect (via core managers)

## Next steps
- Create the documentation (recommended to finish Phase 3)
