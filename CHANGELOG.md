## v0.5.2

Features and improvements:

- Phase 3 Completion: Infinite queries, SSR, and examples
  - Remix SSR example: Complete server-side rendering demo with route loaders, prefetch, dehydration, and client hydration
  - Node/Edge adapters: Complete cross-runtime compatibility utilities (isServer, isEdge, isNode, getFetch, getAbortController, etc.)
  - Examples verification: Confirmed all Phase 3 examples exist (pagination, dependent queries, optimistic updates)
  - Documentation: Created Phase3-Verification.md with complete checklist and file references
- Bug fixes:
  - Removed debug console.log statements from QueryClient (mount, unmount, hydrate, dehydrate)
  - Fixed Remix demo setup: Added to workspace, fixed dependencies, resolved TypeScript React 18/19 compatibility issues

## v0.5.1

Bug fixes and improvements:

- Fixed devtoolsBridge integration tests: Replaced invalid `test.skip()` calls with `test.skipIf()` at test definition level
- Added test suite for `@mfestack/react-devtools` package: 3 smoke tests to verify component rendering
- Added vitest configuration for react-devtools package with jsdom environment
- Fixed TypeScript lint errors in test files (implicit any types, unused imports)
- All test suites now passing: 259 tests total (208 core, 33 react, 15 devtools-core, 3 react-devtools)

## v0.5.0

Features and improvements:

- Phase 5: DevTools and Observability
  - EventBus: Typed event system with replay buffer and priority queuing (high, normal, low)
  - LoggerPlugin: Structured logging with configurable levels (error, warn, info, debug), error aggregation, and debug toggles
  - @mfestack/devtools-core: Framework-agnostic DevTools core with state management, EventBus subscriptions, and action methods
  - @mfestack/react-devtools: React DevTools UI with docked panel, search/filter/sort, data explorer, and modern dark-mode theme
  - Metrics System: Lightweight in-memory metrics buffer tracking queries, mutations, cache operations with React hook support
  - Instrumentation: Event emissions throughout Query and Mutation lifecycle (query:added, query:updated, mutation:started, etc.)

- Phase 6: Performance Optimizations
  - BatchManager: Enhanced with RAF/idle flush instead of setTimeout(0), error handling, and strategy options
  - NotifyManager: Enhanced with microtask and RAF batching, queue size limits, and configurable flush strategies
  - TaskScheduler: Unified scheduler for background tasks with priorities, delays, intervals, and cancellation
  - BackoffController: Retry delay calculation with exponential/linear/constant strategies, jitter support, and max delay caps
  - Select Memoization: Implemented in QueryObserver with structural sharing using replaceEqualDeep for stable references
  - Integration: TaskScheduler integrated with QueryClient for refetch intervals and garbage collection timers
  - Benchmarks: Comprehensive suite for bundle size, performance, and tree-shaking verification

- Tests: All 256 tests passing (208 core, 33 react, 15 devtools-core)

- Documentation: DevTools usage guide, updated metrics API docs, enhanced examples

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

