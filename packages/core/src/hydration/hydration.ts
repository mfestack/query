// Hydration utilities for SSR and persistence
import type { DehydratedState, DehydrateOptions, HydrateOptions, QueryClient } from '../types'

export function hydrate(
  queryClient: QueryClient,
  dehydratedState: DehydratedState,
  _options?: HydrateOptions
): void {
  queryClient.hydrate(dehydratedState)
}

export function dehydrate(
  queryClient: QueryClient,
  options?: DehydrateOptions
): DehydratedState {
  return queryClient.dehydrate(options)
}

export function defaultShouldDehydrateQuery(query: any): boolean {
  return query.state.status !== 'idle' || query.state.dataUpdatedAt > 0
}

export function defaultShouldDehydrateMutation(mutation: any): boolean {
  return mutation.state.status !== 'idle'
}
