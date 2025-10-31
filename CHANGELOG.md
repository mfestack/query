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

