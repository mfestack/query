## 🧰 DevTools Usage & Troubleshooting

### Overview

DevTools are split into a framework-agnostic core engine and framework wrappers:

- `@mfestack/devtools-core`: subscribes to `QueryClient.eventBus` and manages state (queries, mutations, events timeline), exposing an imperative API.
- `@mfestack/react-devtools`: React components and hooks that render the DevTools UI using the core engine.

### Installation

```bash
pnpm add @mfestack/react-devtools
```

### Usage (React)

```tsx
import { QueryClientProvider } from '@mfestack/react'
import { AppStackDevtools } from '@mfestack/react-devtools'

export function App() {
  return (
    <QueryClientProvider>
      {/* ... app routes */}
      <AppStackDevtools />
    </QueryClientProvider>
  )
}
```

Features:

- Queries tab: inspect keys, status, stale flags; refetch/invalidate/remove actions
- Mutations tab: see in-flight/finished mutations and errors
- Cache tab: clear cache
- Events tab: timeline of EventBus events (bounded buffer)
- Metrics: live counters from core `Metrics`

### Devtools Core API (for custom UIs)

```ts
import { AppStackDevtoolsCore } from '@mfestack/devtools-core'
import { QueryClient } from '@mfestack/core'

const client = new QueryClient()
const core = new AppStackDevtoolsCore(client)

const unsubscribe = core.subscribe((state) => {
  // state.queries, state.mutations, state.events
})

// Actions
core.refetchQuery(['users'])
core.invalidateQuery(['users'])
core.removeQuery(['users'])
core.clearCache()
```

### Troubleshooting

- DevTools doesn’t update:
  - Ensure `QueryClient` is initialized and provided; DevTools core subscribes to `client.eventBus`.
  - Verify events are emitted (e.g., a fetch or mutation executed).
  - In tests/headless, scheduling can be deferred; use `await Promise.resolve()` to flush microtasks.

- Type errors when importing packages in the monorepo:
  - Build `@mfestack/core` first so declaration files exist. `tsconfig` paths point to `../core/build`.

- React demo can’t resolve devtools packages:
  - Add Vite aliases to `src` during development or depend on built outputs.

- Timeline shows at most 50 events:
  - This is by design to bound memory; adjust via `EventBus` replay buffer size if needed.

### Notes

- DevTools uses the plugin-first architecture and does not add runtime overhead in production when not mounted.
- The engine is UI-agnostic: you can wrap it in Vue/Angular/Svelte UIs by consuming the same core.


