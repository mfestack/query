## v0.4.0

Features and improvements:

- Core - Persistence & Broadcast (Phase 4)
  - New persistence infrastructure:
    - `createPersistor` interface for custom storage adapters
    - `persistQueryClient` function for automatic cache persistence
    - `createLocalStoragePersistor` for browser localStorage
    - `createMemoryPersistor` for SSR/testing environments
  - Enhanced `broadcastPlugin`:
    - Scoped channels for multi-app isolation (`scope` option)
    - Throttling support (`throttleMs` option)
    - Origin tracking to prevent feedback loops
    - Full state broadcasting with deduplication
  - New `createSyncCoordinator`:
    - Orchestrates persistence and broadcast with proper ordering
    - Restores from storage on startup
    - Debounced cache updates (persist → broadcast)
    - Handles errors gracefully
  - Updated `persistPlugin` to use new Persistor infrastructure internally
- Tests
  - 9 comprehensive persistence tests
  - 8 enhanced broadcast plugin tests
  - 1 sync coordinator test
  - All 89 tests passing

Documentation:
- New setup guide: "Setup - Persistence & Broadcast.md"
- Complete examples for React and Next.js
- Troubleshooting section

## v0.3.0

Features and improvements:

- Core
  - Implemented `prefetchQuery` and `fetchQuery` methods for server-side prefetching
  - Enhanced QueryClient with SSR support
- React
  - New hook: `useInfiniteQuery` with `fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`
  - Support for `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`
  - Comprehensive edge case testing (13 tests)
- Examples
  - Added InfiniteQueryDemo component in React demo
  - Created Next.js SSR example with:
    - Server-side prefetching in layout and route pages
    - Dehydration/hydration flow
    - Script tag serialization for state transfer
- Documentation
  - Updated React package README with usage examples

Fixes:
- Fixed infinite loop in `useInfiniteQuery` by using refs for options and single initialization
- Proper error handling and state management in infinite queries

Tests:
- 13 comprehensive edge case tests for `useInfiniteQuery`
- All 33 tests passing in React package

## v0.2.0

Features and improvements:

- Core
  - Retry integration in Query with AbortSignal cancellation
  - staleTime support and observer notifications
  - Focus/online refetch policies with visibilitychange handling
  - Hydration: dehydrate/hydrate roundtrip APIs
- React
  - Suspense support (suspense: true)
  - keepPreviousData for smoother pagination/param changes
  - New hooks: useIsFetching, useIsMutating
- Demo
  - Added Suspense, KeepPreviousData, and Focus/Reconnect examples

Fixes:
- Prevent unhandled promise rejections in demo when refetch fails
- WorldTime API endpoint stabilized for demo

CI/CD:
- Ready to publish via tag-triggered workflow

