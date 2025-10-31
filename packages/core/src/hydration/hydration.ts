// Hydration utilities for SSR and persistence
import type { DehydratedState, DehydrateOptions, HydrateOptions, QueryClient } from '../types'
import { ClientRegistry, type QueryClientScope } from '../client/ClientRegistry'
import { replaceEqualDeep } from '../utils/helpers'

export function hydrate(
  queryClient: QueryClient,
  dehydratedState: DehydratedState,
  options?: HydrateOptions
): void {
  queryClient.hydrate(dehydratedState, options)
}

export function dehydrate(
  queryClient: QueryClient,
  options?: DehydrateOptions
): DehydratedState {
  return queryClient.dehydrate(options)
}

/**
 * Merge strategies for scoped hydration
 */
export type HydrateMergeStrategy = 
  | 'preferServer'  // Always overwrite with server state
  | 'preferClient'  // Only hydrate if client doesn't have data
  | 'mergeStructural' // Deep merge with structural sharing
  | 'overwrite'      // Simple shallow merge (default)

/**
 * Scoped hydration: Hydrate a specific scope's client
 */
export function hydrateScope(
  scope: QueryClientScope,
  dehydratedState: DehydratedState,
  options?: HydrateOptions & { mergeStrategy?: HydrateMergeStrategy }
): void {
  const client = ClientRegistry.get(scope)
  if (!client) {
    throw new Error(`No QueryClient registered for scope: ${String(scope)}`)
  }
  
  const mergeStrategy = options?.mergeStrategy ?? 'overwrite'
  
  // Apply merge strategy
  if (mergeStrategy === 'preferClient') {
    // Filter out queries/mutations that already exist with data
    const filteredState: DehydratedState = {
      queries: dehydratedState.queries.filter((q) => {
        const existing = client.queryCache.find(q.queryKey)
        return !existing || !existing.state.data
      }),
      mutations: dehydratedState.mutations.filter((m) => {
        const existing = client.mutationCache.find(m.mutationKey)
        return !existing || !existing.state.data
      }),
    }
    client.hydrate(filteredState, options)
  } else if (mergeStrategy === 'mergeStructural') {
    // Deep merge with structural sharing
    dehydratedState.queries?.forEach((q) => {
      const existing = client.queryCache.find(q.queryKey)
      if (existing && existing.state.data && q.state?.data) {
        // Deep merge data
        q.state = {
          ...q.state,
          data: replaceEqualDeep(existing.state.data, q.state.data),
        }
      }
    })
    client.hydrate(dehydratedState, options)
  } else {
    // 'preferServer' or 'overwrite' - default behavior
    client.hydrate(dehydratedState, options)
  }
}

/**
 * Scoped dehydration: Dehydrate a specific scope's client
 */
export function dehydrateScope(
  scope: QueryClientScope,
  options?: DehydrateOptions
): DehydratedState {
  const client = ClientRegistry.get(scope)
  if (!client) {
    throw new Error(`No QueryClient registered for scope: ${String(scope)}`)
  }
  return client.dehydrate(options)
}

/**
 * Dehydrate multiple scopes
 */
export function dehydrateScopes(
  scopes: QueryClientScope[],
  options?: DehydrateOptions
): Record<string, DehydratedState> {
  const result: Record<string, DehydratedState> = {}
  scopes.forEach(scope => {
    const client = ClientRegistry.get(scope)
    if (client) {
      result[String(scope)] = client.dehydrate(options)
    }
  })
  return result
}

/**
 * Hydrate multiple scopes
 */
export function hydrateScopes(
  dehydratedStates: Record<string, DehydratedState>,
  options?: HydrateOptions & { mergeStrategy?: HydrateMergeStrategy }
): void {
  Object.entries(dehydratedStates).forEach(([scopeStr, state]) => {
    // Try to resolve scope (string or symbol)
    const scope = ClientRegistry.listScopes().find(s => String(s) === scopeStr) || scopeStr
    hydrateScope(scope, state, options)
  })
}

export function defaultShouldDehydrateQuery(
  query: { state: { status: string; dataUpdatedAt: number } }
): boolean {
  return query.state.status !== 'idle' || query.state.dataUpdatedAt > 0
}

export function defaultShouldDehydrateMutation(
  mutation: { state: { status: string } }
): boolean {
  return mutation.state.status !== 'idle'
}
