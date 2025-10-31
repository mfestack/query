# Remix SSR Demo with MFestack Query

This example demonstrates server-side rendering (SSR) with MFestack Query in Remix.

## Features

- ✅ Server-side prefetching in route loaders
- ✅ Dehydration on the server to serialize query cache
- ✅ Client-side hydration for instant data display
- ✅ No refetch on initial client render (uses hydrated data)
- ✅ Route-level data prefetching

## How It Works

### 1. Server-Side Prefetching

In route loaders (e.g., `app/routes/_index.tsx`), we prefetch data on the server:

```typescript
export async function loader(_args: LoaderFunctionArgs) {
  const queryClient = getQueryClient();
  await prefetchQuery(queryClient, ['user', '1'], () => fetchUser('1'));
  const dehydratedState = getDehydratedState(queryClient);
  return json({ dehydratedState });
}
```

### 2. Dehydration

The query cache is serialized and passed to the client via loader data:

```typescript
// In root.tsx, dehydratedState is extracted from route matches
const dehydratedState = matches.find((m: any) => m.data?.dehydratedState)?.data?.dehydratedState;
```

### 3. Client Hydration

In `app/lib/clientUtils.tsx`, the client reads and hydrates the state:

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
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});
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

Open [http://localhost:5173](http://localhost:5173) to see the demo.

## Routes

- `/` - Home page with prefetched user and posts
- `/about` - About page demonstrating route-level prefetching

## Key Files

- `app/routes/_index.tsx` - Home page with server prefetch
- `app/routes/about.tsx` - About page with route-level prefetch
- `app/lib/clientUtils.tsx` - Client-side QueryClient provider with hydration
- `app/lib/utils.ts` - Helper functions for prefetching and dehydration

## Differences from Next.js Demo

1. **Loaders vs Layout**: Remix uses route loaders instead of layout components for data fetching
2. **Data Serialization**: Remix uses `useLoaderData` for most data, but we use `useMatches()` in root to get QueryClient state
3. **Streaming**: Remix supports streaming out of the box, which works well with this setup

