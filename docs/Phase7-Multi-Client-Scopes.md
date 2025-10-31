# Phase 7: Multi-Client Scopes & Isolation

## Overview

Phase 7 introduces **ClientRegistry** and **scoped hydration** to support multiple isolated QueryClient instances within the same application. This enables:

- **Multi-tenant applications**: Separate cache contexts per user/workspace
- **Module isolation**: Independent query state for different app modules
- **Testing scenarios**: Isolated clients for different test suites
- **Nested scopes**: Hierarchical client organization

## Architecture

### ClientRegistry

The `ClientRegistry` is a singleton that manages QueryClient instances by scope:

```typescript
import { ClientRegistry, QueryClient, type QueryClientScope } from '@mfestack/core'

// Register a client with a scope
const scope: QueryClientScope = 'user-123'
const client = new QueryClient()
ClientRegistry.register(scope, client)

// Retrieve a client
const client = ClientRegistry.get('user-123')

// List all scopes
const scopes = ClientRegistry.listScopes()

// Remove a scope
ClientRegistry.remove('user-123')
```

### Scope Types

Scopes can be:
- **String**: `'user-123'`, `'workspace-abc'`, etc.
- **Symbol**: `Symbol('private-scope')` for truly private scopes

## Scoped Hydration

### Basic Usage

```typescript
import { hydrateScope, dehydrateScope } from '@mfestack/core'

// Dehydrate a specific scope
const state = dehydrateScope('user-123')

// Hydrate a specific scope
hydrateScope('user-123', state)
```

### Merge Strategies

Scoped hydration supports multiple merge strategies to handle conflicts:

#### 1. `preferServer` (default)
Always overwrite client state with server state:

```typescript
hydrateScope('scope1', dehydratedState, {
  mergeStrategy: 'preferServer'
})
```

#### 2. `preferClient`
Only hydrate if client doesn't have data:

```typescript
hydrateScope('scope1', dehydratedState, {
  mergeStrategy: 'preferClient'
})
```

#### 3. `mergeStructural`
Deep merge with structural sharing (preserves object references):

```typescript
hydrateScope('scope1', dehydratedState, {
  mergeStrategy: 'mergeStructural'
})
```

#### 4. `overwrite`
Simple shallow merge (default behavior):

```typescript
hydrateScope('scope1', dehydratedState, {
  mergeStrategy: 'overwrite'
})
```

### Multiple Scope Operations

Dehydrate or hydrate multiple scopes at once:

```typescript
import { dehydrateScopes, hydrateScopes } from '@mfestack/core'

// Dehydrate multiple scopes
const states = dehydrateScopes(['user-123', 'user-456'])

// Result: { 'user-123': DehydratedState, 'user-456': DehydratedState }

// Hydrate multiple scopes
hydrateScopes(states, {
  mergeStrategy: 'preferServer'
})
```

## Per-Scope Policies

Policies allow you to configure defaultOptions and plugins that apply to all clients in a scope:

### Setting Policies

```typescript
import { ClientRegistry, persistPlugin } from '@mfestack/core'

// Set policy when registering
const client = new QueryClient()
ClientRegistry.register('user-123', client, {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
  plugins: [
    persistPlugin({
      key: 'user-123-cache',
      storage: localStorage,
    }),
  ],
})

// Or set policy separately
ClientRegistry.setPolicy('user-123', {
  defaultOptions: {
    queries: {
      retry: 3,
    },
  },
})

// Get policy
const policy = ClientRegistry.getPolicy('user-123')
```

### Policy Application

Policies are automatically applied:
1. **When registering**: If a policy exists, it's applied to the new client
2. **After setting**: If a client is already registered, the policy is applied immediately
3. **Before registering**: You can set a policy before registering a client, and it will be applied when the client is registered

## Use Cases

### Multi-Tenant Application

```typescript
// User switches tenants
function switchTenant(tenantId: string) {
  const scope: QueryClientScope = `tenant-${tenantId}`
  
  // Get or create tenant-specific client
  let client = ClientRegistry.get(scope)
  if (!client) {
    client = new QueryClient()
    ClientRegistry.register(scope, client, {
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // Tenant-specific cache settings
        },
      },
    })
  }
  
  return client
}
```

### Module Isolation

```typescript
// Separate client for admin module
const adminClient = new QueryClient()
ClientRegistry.register('admin', adminClient, {
  defaultOptions: {
    queries: {
      staleTime: 0, // Always fresh for admin
    },
  },
})

// Separate client for user module
const userClient = new QueryClient()
ClientRegistry.register('user', userClient, {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})
```

### SSR with Scoped Hydration

```typescript
// Server: Dehydrate multiple scopes
const tenantStates = dehydrateScopes(['tenant-a', 'tenant-b'])

// Client: Hydrate scopes
hydrateScopes(tenantStates, {
  mergeStrategy: 'preferServer',
})
```

### Testing with Isolation

```typescript
describe('Feature A', () => {
  beforeEach(() => {
    const client = new QueryClient()
    ClientRegistry.register('test-feature-a', client)
  })

  afterEach(() => {
    ClientRegistry.remove('test-feature-a')
  })
})

describe('Feature B', () => {
  beforeEach(() => {
    const client = new QueryClient()
    ClientRegistry.register('test-feature-b', client)
  })

  afterEach(() => {
    ClientRegistry.remove('test-feature-b')
  })
})
```

## API Reference

### ClientRegistry

```typescript
class ClientRegistry {
  has(scope: QueryClientScope): boolean
  register(scope: QueryClientScope, client: QueryClient, policy?: ScopePolicy): void
  get(scope: QueryClientScope): QueryClient | undefined
  remove(scope: QueryClientScope): void
  clear(): void
  listScopes(): QueryClientScope[]
  setPolicy(scope: QueryClientScope, policy: ScopePolicy): void
  getPolicy(scope: QueryClientScope): ScopePolicy | undefined
}
```

### Scoped Hydration Functions

```typescript
function hydrateScope(
  scope: QueryClientScope,
  dehydratedState: DehydratedState,
  options?: HydrateOptions & { mergeStrategy?: HydrateMergeStrategy }
): void

function dehydrateScope(
  scope: QueryClientScope,
  options?: DehydrateOptions
): DehydratedState

function dehydrateScopes(
  scopes: QueryClientScope[],
  options?: DehydrateOptions
): Record<string, DehydratedState>

function hydrateScopes(
  dehydratedStates: Record<string, DehydratedState>,
  options?: HydrateOptions & { mergeStrategy?: HydrateMergeStrategy }
): void
```

### Types

```typescript
type QueryClientScope = string | symbol

interface ScopePolicy {
  defaultOptions?: DefaultOptions
  plugins?: AppStackPlugin[]
}

type HydrateMergeStrategy = 
  | 'preferServer'
  | 'preferClient'
  | 'mergeStructural'
  | 'overwrite'
```

## Best Practices

1. **Use string scopes for most cases**: Easier to debug and serialize
2. **Use symbol scopes for privacy**: When you want truly isolated scopes that can't be accessed by scope name
3. **Set policies before registering**: More predictable behavior
4. **Clean up in tests**: Always `remove()` scopes in `afterEach` to avoid test pollution
5. **Use meaningful scope names**: Makes debugging easier (`'user-${userId}'` vs `'scope1'`)
6. **Consider merge strategies**: Choose the right strategy based on your use case (SSR vs. offline-first)

## Comparison with TanStack Query

| Feature                  | TanStack Query | MFEStack Query |
| ------------------------ | -------------- | -------------- |
| Multiple clients         | ✅ Manual      | ✅ ClientRegistry |
| Scoped hydration         | ❌             | ✅ Full support |
| Per-scope policies       | ❌             | ✅ DefaultOptions + Plugins |
| Merge strategies         | ❌             | ✅ 4 strategies |
| Symbol scopes            | ❌             | ✅ Supported |

## Migration Guide

If you're currently using multiple QueryClient instances manually:

**Before:**
```typescript
const adminClient = new QueryClient()
const userClient = new QueryClient()
```

**After:**
```typescript
import { ClientRegistry } from '@mfestack/core'

ClientRegistry.register('admin', new QueryClient())
ClientRegistry.register('user', new QueryClient())

const adminClient = ClientRegistry.get('admin')
const userClient = ClientRegistry.get('user')
```

This provides better isolation, policy management, and scoped hydration support.

