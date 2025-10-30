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

export class QueryClient implements QueryClientInterface {
  public queryCache: QueryCache
  public mutationCache: MutationCache
  private pluginManager: PluginManager
  private defaultOptions: DefaultOptions
  private logger: Logger
  private isMounted = false

  constructor(config: QueryClientConfig = {}) {
    this.queryCache = config.queryCache || new QueryCache()
    this.mutationCache = config.mutationCache || new MutationCache()
    this.pluginManager = new PluginManager()

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
    
    // Trigger plugin events
    this.pluginManager.notifyQueryAdded(query)
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
    
    queries.forEach(query => {
      query.state.isInvalidated = true
      // TODO: Trigger refetch
    })
  }

  async refetchQueries(filters?: QueryFilters): Promise<void> {
    const queries = this.queryCache.findAll(filters)
    this.logger.log('refetchQueries', { filters, count: queries.length })
    // Implementation will be added later
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
    // Implementation will be added later
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
  }

  mount(): void {
    if (this.isMounted) return
    
    this.isMounted = true
    this.logger.log('mount')
    
    // Setup focus and online listeners
    focusManager.subscribe(() => {
      this.refetchQueries({ type: 'active' })
    })
    
    onlineManager.subscribe(() => {
      if (onlineManager.getOnlineStatus()) {
        this.refetchQueries({ type: 'active' })
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
    // Implementation will be added later
  }

  dehydrate(options?: DehydrateOptions): DehydratedState {
    this.logger.log('dehydrate', { options })
    
    const state = {
      queries: [],
      mutations: [],
    }
    
    // Trigger onPersist for all plugins
    this.pluginManager.getPlugins().forEach(plugin => {
      plugin.onPersist?.(this, state)
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
    _options: QueryOptions<TData, TError, TVariables, TContext>
  ): Promise<void> {
    throw new Error('prefetchQuery not implemented yet')
  }

  async fetchQuery<TData, TError, TVariables, TContext extends QueryKey>(
    _options: QueryOptions<TData, TError, TVariables, TContext>
  ): Promise<TData> {
    throw new Error('fetchQuery not implemented yet')
  }
}