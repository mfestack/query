// Client-related types for AppStack Query

import type { QueryOptions, QueryFilters, QueryState, QueryKey } from './queryTypes'
import type { MutationOptions, MutationFilters, MutationState, MutationKey } from './mutationTypes'
import type { AppStackPlugin } from './pluginTypes'
import type { QueryCache } from '../query/QueryCache'
import type { MutationCache } from '../mutation/MutationCache'
import type { Query } from '../query/Query'
import type { Mutation } from '../mutation/Mutation'
import type { EventBus, EventBusOptions } from '../utils/EventBus'

export interface QueryClientConfig {
  defaultOptions?: DefaultOptions
  queryCache?: QueryCache
  mutationCache?: MutationCache
  logger?: Logger
  plugins?: AppStackPlugin[]
  eventBus?: EventBusOptions & { instance?: EventBus }
}

export interface DefaultOptions {
  queries?: Partial<QueryOptions>
  mutations?: Partial<MutationOptions>
}

export interface Logger {
  log: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export interface QueryClient {
  queryCache: QueryCache
  mutationCache: MutationCache
  eventBus: EventBus
  getQueryCache: () => QueryCache
  getMutationCache: () => MutationCache
  getDefaultOptions: () => DefaultOptions
  setDefaultOptions: (options: DefaultOptions) => void
  setQueryData: <TData>(queryKey: QueryKey, updater: Updater<TData | undefined, TData | undefined>) => void
  getQueryData: <TData>(queryKey: QueryKey) => TData | undefined
  invalidateQueries: (filters?: QueryFilters) => Promise<void>
  refetchQueries: (filters?: QueryFilters) => Promise<void>
  removeQueries: (filters?: QueryFilters) => void
  cancelQueries: (filters?: QueryFilters) => void
  executeMutation: <TData, TError, TVariables, TContext>(
    options: MutationOptions<TData, TError, TVariables, TContext>
  ) => Promise<TData>
  setMutationData: <TData>(
    mutationKey: MutationKey,
    updater: Updater<TData | undefined, TData | undefined>
  ) => void
  getMutationData: <TData>(mutationKey: MutationKey) => TData | undefined
  resetMutations: (filters?: MutationFilters) => void
  cancelMutations: (filters?: MutationFilters) => void
  clear: () => void
  mount: () => void
  unmount: () => void
  isFetching: (filters?: QueryFilters) => number
  isMutating: (filters?: MutationFilters) => number
  getQueryState: <TData, TError>(queryKey: QueryKey) => QueryState<TData, TError> | undefined
  getMutationState: <TData, TError, TVariables, TContext>(
    mutationKey: MutationKey
  ) => MutationState<TData, TError, TVariables, TContext> | undefined
  ensureQueryData: <TData, TError, TVariables, TContext extends QueryKey>(
    options: QueryOptions<TData, TError, TVariables, TContext>
  ) => Promise<TData>
  prefetchQuery: <TData, TError, TVariables, TContext extends QueryKey>(
    options: QueryOptions<TData, TError, TVariables, TContext>
  ) => Promise<void>
  fetchQuery: <TData, TError, TVariables, TContext extends QueryKey>(
    options: QueryOptions<TData, TError, TVariables, TContext>
  ) => Promise<TData>
  hydrate: (dehydratedState: DehydratedState, options?: HydrateOptions) => void
  dehydrate: (options?: DehydrateOptions) => DehydratedState
  use: (plugin: AppStackPlugin) => void
  removePlugin: (pluginId: string) => void
}

// QueryCache and MutationCache are concrete classes, not interfaces

export type Updater<TInput, TOutput> = TOutput | ((input: TInput) => TOutput)

export interface DehydratedState {
  queries: Array<{
    queryKey: QueryKey
    queryHash: string
    state: QueryState<any, any>
  }>
  mutations: Array<{
    mutationKey: MutationKey
    state: MutationState<any, any, any, any>
  }>
}

export interface DehydrateOptions {
  shouldDehydrateQuery?: (query: Query<unknown, unknown, unknown, QueryKey>) => boolean
  shouldDehydrateMutation?: (mutation: Mutation<unknown, unknown, unknown, unknown>) => boolean
}

export interface HydrateOptions {
  defaultOptions?: DefaultOptions
  /**
   * Filter function to determine which queries should be hydrated.
   * If not provided, all queries from dehydrated state will be hydrated.
   */
  shouldHydrateQuery?: (query: { queryKey: QueryKey; queryHash: string; state?: any }) => boolean
  /**
   * Filter function to determine which mutations should be hydrated.
   * If not provided, all mutations from dehydrated state will be hydrated.
   */
  shouldHydrateMutation?: (mutation: { mutationKey: MutationKey; state?: any }) => boolean
  /**
   * Specific query keys to hydrate. If provided, only queries matching these keys will be hydrated.
   * This is a convenience option that overrides shouldHydrateQuery.
   */
  queryKeys?: QueryKey[]
  /**
   * Specific mutation keys to hydrate. If provided, only mutations matching these keys will be hydrated.
   * This is a convenience option that overrides shouldHydrateMutation.
   */
  mutationKeys?: MutationKey[]
}

// Re-export types from other modules
export type { QueryKey, QueryState, Query, QueryObserver, QueryOptions, QueryFilters } from './queryTypes'
export type { MutationKey, MutationState, Mutation, MutationObserver, MutationOptions, MutationFilters } from './mutationTypes'
