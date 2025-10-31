// QueryClient - Main entry point for AppStack Query
import type {
  QueryClient as QueryClientInterface,
  QueryClientConfig,
  QueryKey,
  QueryOptions,
  MutationOptions,
  QueryFilters,
  MutationFilters,
  QueryState,
  MutationState,
  DehydratedState,
  DehydrateOptions,
  Updater,
  Logger,
  DefaultOptions,
  MutationKey,
} from '../types'

import { QueryCache } from '../query/QueryCache'
import { MutationCache } from '../mutation/MutationCache'
import { PluginManager } from '../plugins/PluginManager'
import { focusManager } from '../managers/FocusManager'
import { onlineManager } from '../managers/OnlineManager'
import { functionalUpdate } from '../utils/helpers'
import { defaultOptions } from './defaultOptions'
import { EventBus, type EventBusOptions } from '../utils/EventBus'
import { Metrics } from '../metrics/Metrics'

export class QueryClient implements QueryClientInterface {
  public queryCache: QueryCache
  public mutationCache: MutationCache
  public eventBus: EventBus
  public metrics: Metrics
  private pluginManager: PluginManager
  private defaultOptions: DefaultOptions
  private logger: Logger
  private isMounted = false

  constructor(config: QueryClientConfig = {}) {
    // Initialize EventBus with optional configuration
    const eventBusOptions: EventBusOptions = {
      enableReplay: config.eventBus?.enableReplay ?? true,
      defaultPriority: config.eventBus?.defaultPriority ?? 'normal',
      replayBufferSize: config.eventBus?.replayBufferSize ?? 50,
    }
    this.eventBus = config.eventBus?.instance || new EventBus(eventBusOptions)
    
    // Initialize caches with EventBus reference
    this.queryCache = config.queryCache || new QueryCache(this.eventBus)
    if (config.queryCache && !(config.queryCache as any).eventBus) {
      (config.queryCache as any).setEventBus(this.eventBus)
    }
    
    this.mutationCache = config.mutationCache || new MutationCache(this.eventBus)
    if (config.mutationCache && !(config.mutationCache as any).eventBus) {
      (config.mutationCache as any).setEventBus(this.eventBus)
    }
    
    this.pluginManager = new PluginManager()
    
    // Initialize metrics and attach to EventBus
    this.metrics = new Metrics(this.eventBus)

    this.defaultOptions = {
      ...defaultOptions,
      ...config.defaultOptions,
    }

    this.logger = config.logger || console

    this.mount()
  }

  // Query Cache methods
  getQueryCache(): QueryCache {
    return this.queryCache
  }

  getMutationCache(): MutationCache {
    return this.mutationCache
  }

  getDefaultOptions(): DefaultOptions {
    return this.defaultOptions
  }

  setDefaultOptions(options: DefaultOptions): void {
    this.defaultOptions = {
      queries: { ...this.defaultOptions.queries, ...options.queries },
      mutations: { ...this.defaultOptions.mutations, ...options.mutations },
    }
  }

  // Query data methods
  setQueryData<TData>(
    queryKey: QueryKey,
    updater: Updater<TData | undefined, TData | undefined>
  ): void {
    let query = this.queryCache.find<TData, Error>(queryKey)
    if (!query) {
      // Create query if it doesn't exist
      query = this.queryCache.build<TData, Error, TData, QueryKey>(this, {
        queryKey,
        queryFn: () => Promise.resolve(undefined as TData),
      })
    }
    
    const newData = functionalUpdate(updater, query.state.data as TData | undefined)
    this.logger.log('setQueryData', { queryKey, newData })
    query.state.data = newData
    query.state.dataUpdatedAt = Date.now()
    
    // Emit EventBus event
    this.eventBus.emit('query:updated', { query: query as any }, 'normal')
    
    // Trigger plugin events
    this.pluginManager.notifyQueryAdded(query as any)
    this.pluginManager.notifyCacheUpdate(this.queryCache)
  }

  getQueryData<TData>(queryKey: QueryKey): TData | undefined {
    const query = this.queryCache.find(queryKey)
    return query?.state.data as TData | undefined
  }

  getQueryState<TData, TError>(queryKey: QueryKey): QueryState<TData, TError> | undefined {
    const query = this.queryCache.find(queryKey)
    return query?.state as QueryState<TData, TError> | undefined
  }

  // Query invalidation methods
  async invalidateQueries(filters?: QueryFilters): Promise<void> {
    const queries = this.queryCache.findAll(filters)
    this.logger.log('invalidateQueries', { filters, count: queries.length })
    
    const queryKeys = queries.map(q => q.queryKey)
    
    queries.forEach(query => {
      query.state.isInvalidated = true
      // TODO: Trigger refetch
    })
    
    // Emit EventBus event
    this.eventBus.emit('cache:invalidated', { queryKeys, filters }, 'normal')
  }

  async refetchQueries(filters?: QueryFilters): Promise<void> {
    const queries = this.queryCache.findAll(filters)
    this.logger.log('refetchQueries', { filters, count: queries.length })
    await Promise.all(
      queries.map(async (query: any) => {
        // Respect refetch policies on focus/reconnect/mount via filters.type 'active'
        if (filters?.type === 'active' && query.state && query.state.isFetching) return
        try {
          await query.fetch()
        } catch (_e) {
          // swallow here; observers will handle error state
        }
      })
    )
  }

  removeQueries(filters?: QueryFilters): void {
    const queries = this.queryCache.findAll(filters)
    this.logger.log('removeQueries', { filters, count: queries.length })
    
    queries.forEach(query => {
      this.queryCache.remove(query)
    })
  }

  cancelQueries(filters?: QueryFilters): void {
    const queries = this.queryCache.findAll(filters)
    this.logger.log('cancelQueries', { filters, count: queries.length })
    queries.forEach((query: any) => {
      if (typeof query.cancel === 'function') {
        query.cancel()
      }
    })
  }

  // Mutation methods
  async executeMutation<TData, TError, TVariables, TContext>(
    options: MutationOptions<TData, TError, TVariables, TContext>
  ): Promise<TData> {
    this.mutationCache.build(this, options)
    this.logger.log('executeMutation', { mutationKey: options.mutationKey })
    // Implementation will be added later
    throw new Error('executeMutation not implemented yet')
  }

  setMutationData<TData>(
    mutationKey: MutationKey,
    updater: Updater<TData | undefined, TData | undefined>
  ): void {
    let mutation = this.mutationCache.find(mutationKey)
    if (!mutation) {
      // Create mutation if it doesn't exist
      mutation = this.mutationCache.build(this, {
        mutationKey,
        mutationFn: () => Promise.resolve(undefined as TData),
      }) as any
    }
    
    if (mutation) {
      const newData = functionalUpdate(updater, mutation.state.data as TData | undefined)
      this.logger.log('setMutationData', { mutationKey, newData })
      mutation.state.data = newData
      
      // Trigger plugin events
      this.pluginManager.notifyMutationAdded(mutation)
      this.pluginManager.notifyCacheUpdate(this.mutationCache)
    }
  }

  getMutationData<TData>(mutationKey: MutationKey): TData | undefined {
    const mutation = this.mutationCache.find(mutationKey)
    return mutation?.state.data as TData | undefined
  }

  getMutationState<TData, TError, TVariables, TContext>(
    mutationKey: MutationKey
  ): MutationState<TData, TError, TVariables, TContext> | undefined {
    const mutation = this.mutationCache.find(mutationKey)
    return mutation?.state as MutationState<TData, TError, TVariables, TContext> | undefined
  }

  resetMutations(filters?: MutationFilters): void {
    const mutations = this.mutationCache.findAll(filters)
    this.logger.log('resetMutations', { filters, count: mutations.length })

    mutations.forEach(mutation => {
      mutation.reset()
    })
  }

  cancelMutations(filters?: MutationFilters): void {
    const mutations = this.mutationCache.findAll(filters)
    this.logger.log('cancelMutations', { filters, count: mutations.length })
    // Implementation will be added later
  }

  // Utility methods
  clear(): void {
    this.queryCache.clear()
    this.mutationCache.clear()
    this.logger.log('clear')
    
    // Emit EventBus event
    this.eventBus.emit('cache:cleared', {}, 'high')
  }

  mount(): void {
    if (this.isMounted) return
    
    this.isMounted = true
    this.logger.log('mount')
    
    // Setup focus and online listeners
    focusManager.subscribe(() => {
      const queries = this.queryCache.findAll()
      queries.forEach((q: any) => {
        const hasObserver = Array.isArray(q.observers) && q.observers.length > 0
        if (!hasObserver) return
        const opt = q.options || {}
        const should = opt.refetchOnWindowFocus === 'always' || opt.refetchOnWindowFocus === true
        if (should) {
          if (q.state && q.state.isFetching) return
          q.fetch().catch(() => {})
        }
      })
    })
    
    onlineManager.subscribe(() => {
      if (onlineManager.getOnlineStatus()) {
        const queries = this.queryCache.findAll()
        queries.forEach((q: any) => {
          const hasObserver = Array.isArray(q.observers) && q.observers.length > 0
          if (!hasObserver) return
          const opt = q.options || {}
          const should = opt.refetchOnReconnect === 'always' || opt.refetchOnReconnect === true
          if (should) {
            if (q.state && q.state.isFetching) return
            q.fetch().catch(() => {})
          }
        })
      }
    })
  }

  unmount(): void {
    if (!this.isMounted) return
    
    this.isMounted = false
    this.logger.log('unmount')
  }

  isFetching(filters?: QueryFilters): number {
    const queries = this.queryCache.findAll(filters)
    return queries.filter(query => query.state.isFetching).length
  }

  isMutating(filters?: MutationFilters): number {
    const mutations = this.mutationCache.findAll(filters)
    return mutations.filter(mutation => mutation.state.isLoading).length
  }

  // Hydration methods
  hydrate(dehydratedState: DehydratedState): void {
    this.logger.log('hydrate', { state: dehydratedState })
    if (!dehydratedState) return
    dehydratedState.queries?.forEach((q: any) => {
      const query = this.queryCache.build(this, {
        queryKey: q.queryKey as QueryKey,
        queryFn: (() => Promise.resolve(q.state?.data)) as any,
      })
      ;(query as any).state = { ...(query as any).state, ...(q.state || {}) }
    })
    dehydratedState.mutations?.forEach((_m: any) => {
      // no-op for now
    })
  }

  dehydrate(options?: DehydrateOptions): DehydratedState {
    this.logger.log('dehydrate', { options })
    
    const state: DehydratedState = {
      queries: Array.from(this.queryCache.queriesMap.values()).map((q: any) => ({
        queryKey: q.queryKey,
        queryHash: q.queryHash,
        state: q.state,
      })),
      mutations: [],
    }
    
    // Trigger onPersist for all plugins
    this.pluginManager.getPlugins().forEach(plugin => {
      try { plugin.onPersist?.(this, state) } catch {}
    })
    
    return state
  }

  // Plugin methods
  use(plugin: any): void {
    this.pluginManager.register(plugin)
    // Trigger onInit event
    plugin.onInit?.(this)
  }

  removePlugin(pluginId: string): void {
    this.pluginManager.unregister(pluginId)
  }

  // Placeholder methods for future implementation
  async ensureQueryData<TData, TError, TVariables, TContext extends QueryKey>(
    _options: QueryOptions<TData, TError, TVariables, TContext>
  ): Promise<TData> {
    throw new Error('ensureQueryData not implemented yet')
  }

  async prefetchQuery<TData, TError, TVariables, TContext extends QueryKey>(
    options: QueryOptions<TData, TError, TVariables, TContext>
  ): Promise<void> {
    const queryKey = options.queryKey
    let query = this.queryCache.find(queryKey)
    
    // If query exists and has fresh data, skip prefetch
    if (query && query.state.dataUpdatedAt > 0 && !query.state.isStale) {
      return
    }
    
    // Build query if it doesn't exist
    if (!query) {
      query = this.queryCache.build<TData, TError, TVariables, TContext>(this, {
        ...options,
        retry: options.retry ?? this.defaultOptions.queries?.retry,
        retryDelay: options.retryDelay ?? this.defaultOptions.queries?.retryDelay,
        staleTime: options.staleTime ?? this.defaultOptions.queries?.staleTime,
        gcTime: options.gcTime ?? this.defaultOptions.queries?.gcTime,
      } as QueryOptions<TData, TError, TVariables, TContext>) as any
    }
    
    // Fetch the query
    if (query && typeof query.fetch === 'function') {
      await query.fetch()
    }
  }

  async fetchQuery<TData, TError, TVariables, TContext extends QueryKey>(
    options: QueryOptions<TData, TError, TVariables, TContext>
  ): Promise<TData> {
    const queryKey = options.queryKey
    let query = this.queryCache.find(queryKey)
    
    // Build query if it doesn't exist
    if (!query) {
      query = this.queryCache.build<TData, TError, TVariables, TContext>(this, {
        ...options,
        retry: options.retry ?? this.defaultOptions.queries?.retry,
        retryDelay: options.retryDelay ?? this.defaultOptions.queries?.retryDelay,
        staleTime: options.staleTime ?? this.defaultOptions.queries?.staleTime,
        gcTime: options.gcTime ?? this.defaultOptions.queries?.gcTime,
      } as QueryOptions<TData, TError, TVariables, TContext>) as any
    }
    
    // Fetch the query and return data
    if (query && typeof query.fetch === 'function') {
      const result = await query.fetch()
      return result as TData
    }
    
    // Return existing data if available
    return query?.state.data as TData
  }
}