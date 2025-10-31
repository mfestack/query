# Migration from TanStack Query

This guide helps you migrate from TanStack Query (React Query) to MFestack Query.

## Why Migrate?

MFestack Query provides all the features of TanStack Query plus:

- **Multi-App Synchronization** - Share cache across micro-frontends
- **Scoped Clients** - Isolated query clients per scope/tenant
- **Enhanced Plugin System** - More powerful extensibility
- **Better DevTools** - Built-in observability
- **Framework Agnostic** - Same core for all frameworks

## API Compatibility

MFestack Query maintains **near 100% API compatibility** with TanStack Query v5, so most code will work without changes.

### Direct Replacements

```diff
- import { useQuery, useMutation } from '@tanstack/react-query'
+ import { useQuery, useMutation } from '@mfestack/react'

- import { QueryClient } from '@tanstack/react-query'
+ import { QueryClient } from '@mfestack/core'
```

## Key Differences

### 1. Package Names

| TanStack Query | MFestack Query |
|----------------|----------------|
| `@tanstack/react-query` | `@mfestack/react` |
| `@tanstack/query-core` | `@mfestack/core` |

### 2. Scoped Clients

MFestack Query adds ClientRegistry for multi-tenant support:

```tsx
import { ClientRegistry } from '@mfestack/core'

const client = new QueryClient()
ClientRegistry.register('user-123', client)
```

### 3. Enhanced Hydration

Scoped hydration for multiple isolated clients:

```tsx
import { hydrateScope, dehydrateScope } from '@mfestack/core'

const state = dehydrateScope('user-123')
hydrateScope('user-123', state, { mergeStrategy: 'preferServer' })
```

## Migration Steps

1. **Update dependencies**
   ```bash
   npm uninstall @tanstack/react-query
   npm install @mfestack/core @mfestack/react
   ```

2. **Update imports** (find & replace)
   ```diff
   - @tanstack/react-query
   + @mfestack/react
   ```

3. **Test thoroughly** - Most code should work unchanged

4. **Explore new features** - Multi-app sync, scoped clients, enhanced plugins

## Feature Parity

✅ All TanStack Query features are supported:
- Queries, mutations, infinite queries
- SSR and hydration
- DevTools
- Optimistic updates
- Query invalidation
- Cache management

✅ Plus additional features:
- Multi-client scopes
- Enhanced plugin system
- Cross-tab synchronization
- Advanced metrics

