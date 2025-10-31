# SSR Setup

Server-Side Rendering with MFestack Query.

## Next.js App Router

### 1. Create QueryClient

```tsx
// app/lib/getQueryClient.ts
import { QueryClient } from '@mfestack/core'
import { cache } from 'react'

export const getQueryClient = cache(() => new QueryClient())
```

### 2. Server Component

```tsx
// app/posts/page.tsx
import { getQueryClient } from '@/lib/getQueryClient'
import { dehydrate, hydrate } from '@mfestack/core'

export default async function PostsPage() {
  const queryClient = getQueryClient()
  
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('https://api.example.com/posts').then(r => r.json()),
  })

  const dehydratedState = dehydrate(queryClient)

  return <PostsHydration state={dehydratedState} />
}

function PostsHydration({ state }: { state: any }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__MFESTACK_QUERY_STATE__ = ${JSON.stringify(state)}`,
      }}
    />
  )
}
```

### 3. Client Hydration

```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@mfestack/react'
import { hydrate } from '@mfestack/core'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__MFESTACK_QUERY_STATE__) {
      hydrate(queryClient, window.__MFESTACK_QUERY_STATE__)
    }
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

## Remix

### Route Loader

```tsx
// app/routes/posts.tsx
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { QueryClient, dehydrate } from '@mfestack/core'

export async function loader() {
  const queryClient = new QueryClient()
  
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('https://api.example.com/posts').then(r => r.json()),
  })

  return json({ dehydratedState: dehydrate(queryClient) })
}

export default function Posts() {
  const { dehydratedState } = useLoaderData<typeof loader>()
  
  // Hydrate on client
  useEffect(() => {
    hydrate(queryClient, dehydratedState)
  }, [dehydratedState])

  return <PostsList />
}
```

