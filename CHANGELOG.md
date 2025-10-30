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


