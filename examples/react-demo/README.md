# React Demo - AppStack Query with DevTools

This is a comprehensive demo showcasing AppStack Query features including the DevTools integration.

## Features Demonstrated

- ✅ **Basic Queries** - Fetching and caching data
- ✅ **Mutations** - Creating, updating, and deleting data
- ✅ **Cache Management** - Manual cache manipulation
- ✅ **Suspense Support** - React Suspense integration
- ✅ **Keep Previous Data** - Pagination with smooth transitions
- ✅ **Refetch Behaviors** - Focus and reconnect refetching
- ✅ **Infinite Queries** - Infinite scroll/pagination
- ✅ **DevTools** - Interactive debugging panel

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view the demo.

## DevTools Usage

The demo includes the **AppStack DevTools** panel. To use it:

1. **Open DevTools**: Click the button in the bottom-right corner (or set `initialIsOpen={true}`)
2. **Navigate Tabs**:
   - **Queries**: View all active queries, their status, and perform actions (refetch, invalidate, remove)
   - **Mutations**: Monitor mutation state and errors
   - **Cache**: View cache statistics and clear the cache
   - **Events**: See real-time EventBus events

3. **Try it out**:
   - Trigger queries and mutations in the demo
   - Watch them appear in real-time in DevTools
   - Use action buttons to refetch, invalidate, or remove queries
   - View events as they fire

## DevTools Features

### Queries Panel
- Real-time query list with status indicators
- Query keys and hash information
- Stale/fetching indicators
- Action buttons: 🔄 Refetch, ⚠️ Invalidate, 🗑️ Remove

### Mutations Panel
- Active mutations with status
- Error display for failed mutations
- Pending state tracking

### Cache Panel
- Statistics (total queries, active queries, errors)
- Clear cache button

### Events Panel
- Real-time EventBus event timeline
- Event type color coding
- Expandable payload details

## Code Example

```tsx
import { QueryClient, QueryClientProvider } from '@mfestack/react'
import { AppStackDevtools } from '@mfestack/react-devtools'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
      <AppStackDevtools 
        initialIsOpen={false}
        position="bottom"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  )
}
```

## Build for Production

```bash
pnpm build
```

DevTools will automatically be excluded in production builds (`process.env.NODE_ENV !== 'development'`).
