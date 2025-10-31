## Persistence & Broadcast Setup

This guide shows how to persist the cache across sessions and broadcast updates across tabs/apps using `@mfestack/core`.

### TL;DR

```ts
import {
  // Persistence
  createLocalStoragePersistor,
  persistQueryClient,
  // Broadcast
  broadcastPlugin,
  // Orchestrator
  createSyncCoordinator,
  // Core
  QueryClient,
} from '@mfestack/core'

const queryClient = new QueryClient()

// Option A: Simple persistence only
const persistor = createLocalStoragePersistor({ key: 'mfestack-query-cache' })
await persistQueryClient({ queryClient, persistor })

// Option B: Orchestrated persist + broadcast (recommended)
const coordinator = createSyncCoordinator({
  queryClient,
  persistor,
  broadcast: { scope: 'my-app', throttleMs: 500 },
})
await coordinator.start()

// Optional: Also register broadcast plugin (if you need plugin lifecycle usage)
queryClient.use(broadcastPlugin({ scope: 'my-app', throttleMs: 500 }))
```

---

### 1) Persistence

Persist the query cache to storage and restore it on startup.

```ts
import { QueryClient } from '@mfestack/core'
import { createLocalStoragePersistor, persistQueryClient } from '@mfestack/core'

const queryClient = new QueryClient()

const persistor = createLocalStoragePersistor({
  key: 'mfestack-query-cache',
})

// Restores on init (if fresh) and saves snapshots on cache updates
await persistQueryClient({
  queryClient,
  persistor,
  // Optional
  // dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === 'success' },
  // maxAge: 24 * 60 * 60 * 1000,
})
```

For tests/SSR environments without Web APIs, use the in-memory persistor:

```ts
import { createMemoryPersistor, persistQueryClient } from '@mfestack/core'

const persistor = createMemoryPersistor()
await persistQueryClient({ queryClient, persistor })
```

---

### 2) Broadcast across tabs/apps

Synchronize cache updates using `BroadcastChannel`. Scoped channels isolate different apps/workspaces.

```ts
import { QueryClient, broadcastPlugin } from '@mfestack/core'

const queryClient = new QueryClient()

// Scoped channel: "mfestack-query-sync-my-app"
queryClient.use(
  broadcastPlugin({
    scope: 'my-app',          // optional: isolates channel per app/workspace
    throttleMs: 1000,         // optional: reduce broadcast frequency
  })
)
```

Notes:
- Messages include an `origin` id to prevent feedback loops.
- Full dehydrated state is broadcast (deduplicated by content) for robust sync.
- If `BroadcastChannel` is unavailable, broadcasting silently no-ops.

---

### 3) Orchestrate both with SyncCoordinator (recommended)

`createSyncCoordinator` ensures ordering and debouncing:
- Restores from persistence on start.
- Debounces cache changes and then persists first, broadcasts after.
- Applies channel scoping and origin/dedup safeguards.

```ts
import {
  QueryClient,
  createLocalStoragePersistor,
  createSyncCoordinator,
} from '@mfestack/core'

const queryClient = new QueryClient()
const persistor = createLocalStoragePersistor({ key: 'mfestack-query-cache' })

const coordinator = createSyncCoordinator({
  queryClient,
  persistor,
  broadcast: {
    scope: 'my-app',
    throttleMs: 500,
  },
})

await coordinator.start()

// ... on app shutdown
await coordinator.stop()
```

---

### 4) React usage example

```tsx
import { QueryClient } from '@mfestack/core'
import {
  createLocalStoragePersistor,
  createSyncCoordinator,
} from '@mfestack/core'
import { QueryClientProvider } from '@mfestack/react'

const queryClient = new QueryClient()
const persistor = createLocalStoragePersistor({ key: 'mfestack-query-cache' })
const coordinator = createSyncCoordinator({
  queryClient,
  persistor,
  broadcast: { scope: 'my-app', throttleMs: 500 },
})

await coordinator.start()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* your app */}
    </QueryClientProvider>
  )
}
```

---

### 5) Next.js (SSR) quick notes

- Run persistence only in the browser. Gate with `typeof window !== 'undefined'`.
- Prefer `createMemoryPersistor` in server tests.
- For SSR data, use `dehydrate/hydrate` with your framework’s hydration boundary.

---

### 6) Options reference

Persistence (persistQueryClient):
- `maxAge`: milliseconds to consider a snapshot fresh (default: 24h).
- `dehydrateOptions`: filter/shape dehydrated state.

Broadcast (broadcastPlugin):
- `scope`: isolates channel (e.g., per app/tenant/workspace).
- `throttleMs`: delay to batch frequent updates.
- `serialize/deserialize`: customize message encoding.

SyncCoordinator:
- Persist then broadcast ordering
- Debounced writes via `throttleMs`
- Scope + origin + dedup safeguards

---

### 7) Troubleshooting

- Nothing broadcasts: Your environment may not support `BroadcastChannel`.
- Restores stale data: Lower `maxAge` or remove old snapshots via persistor’s `removeClient()`.
- Frequent broadcasts: Increase `throttleMs`.
- Cross-app pollution: Set a unique `scope` per app/workspace.


