# Scopes & Isolation

MFestack Query supports multiple isolated QueryClient instances for multi-tenant and micro-frontend architectures.

## ClientRegistry

The `ClientRegistry` manages multiple QueryClient instances by scope:

```tsx
import { ClientRegistry, QueryClient } from '@mfestack/core'

// Register clients for different scopes
ClientRegistry.register('tenant-a', new QueryClient())
ClientRegistry.register('tenant-b', new QueryClient())

// Retrieve clients
const clientA = ClientRegistry.get('tenant-a')
const clientB = ClientRegistry.get('tenant-b')
```

## Per-Scope Policies

Configure different policies per scope:

```tsx
ClientRegistry.register('tenant-a', new QueryClient(), {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
  plugins: [
    persistPlugin({ key: 'tenant-a-cache' }),
  ],
})
```

## React Integration

Use scoped clients in React:

```tsx
import { QueryClientProvider } from '@mfestack/react'
import { ClientRegistry } from '@mfestack/core'

function TenantApp({ tenantId }: { tenantId: string }) {
  const client = ClientRegistry.get(tenantId) || ClientRegistry.register(tenantId, new QueryClient())

  return (
    <QueryClientProvider client={client}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

## Scoped Hydration

Hydrate and dehydrate per scope for SSR:

```tsx
import { hydrateScope, dehydrateScope } from '@mfestack/core'

// Server: Dehydrate specific scope
const state = dehydrateScope('tenant-a')

// Client: Hydrate specific scope
hydrateScope('tenant-a', state, {
  mergeStrategy: 'preferServer',
})
```

See [ClientRegistry API](/api/client-registry) for full reference.

