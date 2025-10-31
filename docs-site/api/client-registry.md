# ClientRegistry API

Manage multiple isolated QueryClient instances with scopes.

## Basic Usage

```tsx
import { ClientRegistry, QueryClient } from '@mfestack/core'

// Register a client with a scope
const client = new QueryClient()
ClientRegistry.register('user-123', client)

// Retrieve the client
const client = ClientRegistry.get('user-123')

// Check if scope exists
if (ClientRegistry.has('user-123')) {
  // Scope exists
}

// List all scopes
const scopes = ClientRegistry.listScopes() // ['user-123', 'user-456']

// Remove a scope
ClientRegistry.remove('user-123')

// Clear all scopes
ClientRegistry.clear()
```

## Per-Scope Policies

Configure defaultOptions and plugins per scope:

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

## Scope Types

Scopes can be strings or symbols:

```tsx
// String scope (recommended)
ClientRegistry.register('user-123', client)

// Symbol scope (for privacy)
const privateScope = Symbol('private')
ClientRegistry.register(privateScope, client)
```

## Methods

| Method | Description |
|--------|-------------|
| `register(scope, client, policy?)` | Register a client with optional policy |
| `get(scope)` | Get client by scope |
| `has(scope)` | Check if scope exists |
| `remove(scope)` | Remove a scope |
| `clear()` | Clear all scopes |
| `listScopes()` | List all registered scopes |
| `setPolicy(scope, policy)` | Set policy for a scope |
| `getPolicy(scope)` | Get policy for a scope |

