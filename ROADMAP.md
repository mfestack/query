## MFestack Query — Roadmap & Plans

### Phase 1 — MVP foundation (Completed)
- Core `@mfestack/core` with `QueryClient`, `Query`, `QueryCache`, `Mutation`, `MutationCache`.
- React adapter `@mfestack/react` with `QueryClientProvider`, `useQuery`, `useMutation`.
- Tests stabilized (Vitest), CI (pnpm), demo app using public APIs.
- Packages prepared for npm under `@mfestack` scope, release workflow via tag.

### Phase 2 — Core parity and React polish
- Query lifecycle parity: `staleTime`, `gcTime`, refetch on focus/online/mount, `retry`/`retryDelay`.
- Observer consistency: single initial-fetch path, stable notifications, `select` + structural sharing.
- Cancellation: AbortSignal propagation, `cancelQueries`/`cancelMutations`.
- Hydration: `dehydrate`/`hydrate` APIs with metadata; selective restore.
- React: Suspense/ErrorBoundary, `keepPreviousData`, placeholder vs initialData, `useIsFetching`/`useIsMutating`.
- Tests: 100% coverage for core observer/fetch flows and React hooks.
- Docs: Core API reference; React quickstart.

### Phase 3 — Infinite queries, SSR, and examples
- `useInfiniteQuery`: `pageParams`, `getNextPageParam`/`getPreviousPageParam`, page refetch.
- SSR: Next.js and Remix examples with server prefetch + hydrate; streaming compatibility.
- Adapters: Node/Edge fetch abstraction; `isServer` guards; polyfills.
- Examples: Pagination, dependent queries, optimistic updates.

### Phase 4 — Plugins, persistence, and cross-tab/app sync
- Persist plugin: LocalStorage + IndexedDB persistors, throttled writes, versioned schema, partial restore.
- Broadcast plugin: BroadcastChannel with scoped channels, throttling/dedupe, timestamp conflict resolution.
- Sync coordinator: Order persistence/broadcast to avoid races; debounce bursts.
- Metrics hooks: Minimal telemetry (retries, hit ratio).

### Phase 5 — DevTools and observability
- DevTools panel: Queries/mutations list, state timeline, actions (refetch/invalidate/remove), metrics.
- Event system: Typed EventBus, replay buffer, priorities.
- Logger: Structured logs, error surfaces, debug toggles.

### Phase 6 — Performance, batching, and scheduling
- Notify/Batch managers: Microtask batching guarantees, RAF/idle flush, minimal re-renders.
- Scheduler: Unified refetch intervals, GC timers, retry backoff; cancellation tokens.
- Structural sharing: `replaceEqualDeep`, select memoization, stable results.
- Benchmarks: Bundle size budgets, perf suites, tree-shaking checks.

### Phase 7 — Multi-client scopes and isolation
- ClientRegistry: Scoped clients, nested scopes, cross-client bridge.
- Scoped hydration: Per-scope dehydrate/hydrate; merge strategies.
- Policies: Per-scope defaults and plugin stacks.

### Phase 8 — DX, releases, and CI/CD maturity
- Type safety: Tight generics across core/adapters, zero `any`.
- Versioning: Conventional commits + Changesets, canary releases.
- CI: pnpm monorepo workflows, size-limit, coverage gates, e2e smoke.
- Publishing: Stable tags, provenance, README badges, templates (issues/PRs).

### Phase 9 — Docs site and learning paths
- Site: VitePress/Docusaurus; quickstart, guides, API, recipes (pagination, optimistic, SSR).
- Migration: Differences vs TanStack Query; compatibility guidance.
- Playground: Interactive sandboxes.

### Phase 10 — Ecosystem and future extensions
- Additional adapters: Vue, Svelte/Solid, Angular services.
- Offline-first: Mutation queue, conflict resolution, background sync.
- Edge runtime: Stateless client, streaming hydration, edge-aware retry.
- AI helpers: Prefetch recommendations, invalidate prediction.

### Execution Notes
- Source of truth for behavior: `./docs` (falls back to TanStack Query patterns when unspecified).
- Prioritize Phase 2 lifecycle parity, hydration APIs, and React Suspense next.

