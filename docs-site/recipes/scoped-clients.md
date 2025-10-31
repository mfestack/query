# Scoped Clients

Use isolated QueryClient instances for multi-tenant or micro-frontend architectures.

## Basic Setup

```tsx
import { ClientRegistry, QueryClient } from '@mfestack/core'
import { QueryClientProvider } from '@mfestack/react'

function TenantApp({ tenantId }: { tenantId: string }) {
  // Get or create client for this tenant
  let client = ClientRegistry.get(tenantId)
  
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
        },
      },
    })
    ClientRegistry.register(tenantId, client)
  }

  return (
    <QueryClientProvider client={client}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

## Per-Tenant Policies

Configure different cache policies per tenant:

```tsx
ClientRegistry.register('tenant-a', new QueryClient(), {
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
    },
  },
  plugins: [
    persistPlugin({ key: 'tenant-a', maxAge: 24 * 60 * 60 * 1000 }),
  ],
})

ClientRegistry.register('tenant-b', new QueryClient(), {
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute
    },
  },
})
```

## SSR with Scoped Hydration

```tsx
// Server
const tenantState = dehydrateScope('tenant-a')

// Client
hydrateScope('tenant-a', tenantState, {
  mergeStrategy: 'preferServer',
})
```

## Switching Scopes

```tsx
function TenantSwitcher() {
  const [tenantId, setTenantId] = useState('tenant-a')
  
  const client = ClientRegistry.get(tenantId)

  return (
    <QueryClientProvider client={client}>
      <select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
        <option value="tenant-a">Tenant A</option>
        <option value="tenant-b">Tenant B</option>
      </select>
      <YourApp />
    </QueryClientProvider>
  )
}
```

