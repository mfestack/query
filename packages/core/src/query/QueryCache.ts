// QueryCache - Manages query storage and retrieval
import type { QueryKey, QueryOptions, QueryFilters, QueryCacheNotifyEvent, QueryClient, QueryFunction } from '../types'
import type { EventBus } from '../utils/EventBus'
import { Query } from './Query'
import { hashKey, matchQuery } from '../utils/helpers'
import { Subscribable } from '../utils/Subscribable'

export class QueryCache extends Subscribable<(event: QueryCacheNotifyEvent) => void> {
  private queries = new Map<string, Query>()
  private eventBus?: EventBus

  constructor(eventBus?: EventBus) {
    super()
    this.eventBus = eventBus
  }

  setEventBus(eventBus: EventBus) {
    this.eventBus = eventBus
  }

  find<TData = unknown, TError = Error>(queryKey: QueryKey): Query<TData, TError> | undefined {
    const queryHash = hashKey(queryKey)
    return this.queries.get(queryHash) as Query<TData, TError> | undefined
  }

  findAll(filters?: QueryFilters): Query[] {
    const queries = Array.from(this.queries.values())
    
    if (!filters) {
      return queries
    }

    return queries.filter(query => matchQuery(query, filters))
  }

  add<TData, TError, TVariables, TQueryKey extends QueryKey>(query: Query<TData, TError, TVariables, TQueryKey>) {
    const queryHash = query.queryHash
    if (!this.queries.has(queryHash)) {
      this.queries.set(queryHash, query as unknown as Query<unknown, Error, unknown, QueryKey>)
      this.notify({ type: 'added', query })
      // Emit EventBus event
      if (this.eventBus) {
        this.eventBus.emit('query:added', { query: query as any }, 'normal')
      }
    }
  }

  remove<TData, TError, TVariables, TQueryKey extends QueryKey>(query: Query<TData, TError, TVariables, TQueryKey>) {
    const queryHash = query.queryHash
    if (this.queries.delete(queryHash)) {
      this.notify({ type: 'removed', query })
      // Emit EventBus event
      if (this.eventBus) {
        this.eventBus.emit('query:removed', { query: query as any }, 'normal')
      }
    }
  }

  clear() {
    const queries = Array.from(this.queries.values())
    this.queries.clear()
    
    queries.forEach(query => {
      this.notify({ type: 'removed', query })
    })
  }

  build<TData, TError, TVariables, TContext extends QueryKey>(
    _client: QueryClient,
    options: QueryOptions<TData, TError, TVariables, TContext>
  ): Query<TData, TError> {
    const queryKey = options.queryKey
    const queryHash = hashKey(queryKey)
    
    let query = this.queries.get(queryHash) as Query<TData, TError> | undefined

    if (!query) {
      // Create new query using Query class with proper type conversion
      const queryOptions: QueryOptions<TData, TError, TVariables, QueryKey> = {
        ...options,
        queryKey: queryKey as QueryKey,
        queryFn: options.queryFn as QueryFunction<TData, QueryKey>
      }
      query = new Query<TData, TError, TVariables, QueryKey>(queryOptions) as Query<TData, TError>
      // Set EventBus reference on query for lifecycle events
      if (this.eventBus) {
        query.setEventBus(this.eventBus)
      }
      this.add(query)
    }

    return query
  }

  get size() {
    return this.queries.size
  }

  get queriesMap() {
    return this.queries
  }
}

// Helper function for noop - removed as it's not used
