# Next.js SSR Demo with MFestack Query

This example demonstrates server-side rendering (SSR) with MFestack Query in Next.js 16 App Router.

## Features

- ✅ Server-side prefetching in `app/layout.tsx` and `app/about/page.tsx`
- ✅ Dehydration on the server to serialize query cache
- ✅ Client-side hydration for instant data display
- ✅ No refetch on initial client render (uses hydrated data)
- ✅ Route-level data prefetching

## How It Works

### 1. Server-Side Prefetching

In `app/layout.tsx`, we prefetch data on the server:

```typescript
const queryClient = getQueryClient()
await prefetchQuery(queryClient, ['user', '1'], () => fetchUser('1'))
const dehydratedState = getDehydratedState(queryClient)
```

### 2. Dehydration

The query cache is serialized and embedded in the HTML:

```typescript
<script
  dangerouslySetInnerHTML={{
    __html: `window.__MFESTACK_STATE__ = ${JSON.stringify(dehydratedState)}`,
  }}
/>
```

### 3. Client Hydration

In `app/providers.tsx`, the client reads and hydrates the state:

```typescript
useEffect(() => {
  const state = dehydratedState || (window as any).__MFESTACK_STATE__
  if (state) {
    queryClient.hydrate(state)
  }
}, [queryClient, dehydratedState])
```

### 4. Using Queries

Client components can use `useQuery` which will use the hydrated data:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['user', '1'],
  queryFn: () => fetchUser('1'),
})
```

The data appears instantly without a loading state because it's already hydrated!

## Running the Demo

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

## Routes

- `/` - Home page with prefetched user and posts
- `/about` - About page demonstrating route-level prefetching

## Key Files

- `app/layout.tsx` - Root layout with server prefetch
- `app/providers.tsx` - Client-side QueryClient provider with hydration
- `app/page.tsx` - Home page
- `app/about/page.tsx` - About page with route-level prefetch
- `lib/getQueryClient.ts` - Per-request QueryClient factory
- `lib/utils.ts` - Prefetch and hydration utilities
