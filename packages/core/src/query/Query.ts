// Query - Represents a single query instance
import type { QueryKey, QueryOptions, QueryState, QueryObserver } from '../types'
import { hashKey } from '../utils/helpers'

export class Query<TData = unknown, TError = Error, TVariables = unknown, TQueryKey extends QueryKey = QueryKey> {
  public queryKey: TQueryKey
  public queryHash: string
  public options: QueryOptions<TData, TError, TVariables, TQueryKey>
  public state: QueryState<TData, TError>
  public observers: QueryObserver[] = []

  constructor(options: QueryOptions<TData, TError, TVariables, TQueryKey>) {
    this.queryKey = options.queryKey as TQueryKey
    this.queryHash = hashKey(options.queryKey)
    this.options = options
    this.state = {
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: 'idle',
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: false,
      isInitialLoading: false,
      isLoading: false,
      isInvalidated: false,
      isPaused: false,
      isPending: true,
      isPlaceholderData: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      status: 'idle',
      fetchMeta: null,
    } as QueryState<TData, TError>
  }

  subscribe(observer: QueryObserver) {
    this.observers.push(observer)
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  async fetch(): Promise<TData | undefined> {
    const hasQueryFn = typeof this.options.queryFn === 'function'
    if (!hasQueryFn) {
      return this.state.data as TData | undefined
    }

    // Set fetching state
    this.state = {
      ...this.state,
      isFetching: true,
      isLoading: this.state.dataUpdatedAt === 0,
      isInitialLoading: this.state.dataUpdatedAt === 0,
      status: this.state.dataUpdatedAt === 0 ? 'loading' : this.state.status,
      fetchStatus: 'fetching',
      isError: false,
      error: null,
    }

    const controller = new AbortController()
    try {
      const result = await this.options.queryFn!({
        queryKey: this.queryKey,
        signal: controller.signal,
      } as any)

      const now = Date.now()
      this.state = {
        ...this.state,
        data: result as TData,
        dataUpdatedAt: now,
        isFetching: false,
        isLoading: false,
        isInitialLoading: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isSuccess: true,
        isError: false,
        isStale: false,
        status: 'success',
        fetchStatus: 'idle',
      }

      return result as TData
    } catch (err) {
      const now = Date.now()
      this.state = {
        ...this.state,
        error: err as TError,
        errorUpdatedAt: now,
        isFetching: false,
        isLoading: false,
        isInitialLoading: false,
        isFetched: true,
        isError: true,
        isSuccess: false,
        status: 'error',
        fetchStatus: 'idle',
      }

      throw err
    }
  }

  invalidate(): void {
    // This will be implemented when we create the QueryManager
  }

  remove(): void {
    // This will be implemented when we create the QueryManager
  }
}
