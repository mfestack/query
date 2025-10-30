// QueryObserver - Manages query state and subscriptions for reactivity
import type { 
  QueryKey, 
  QueryObserverOptions,
  QueryClient 
} from '../types'
import { Subscribable } from '../utils/Subscribable'

export interface QueryObserverResult<TData = unknown, TError = Error> {
  data: TData | undefined
  error: TError | null
  isError: boolean
  isLoading: boolean
  isSuccess: boolean
  isFetching: boolean
  isStale: boolean
  status: 'idle' | 'loading' | 'error' | 'success'
  fetchStatus: 'idle' | 'fetching' | 'paused'
  dataUpdatedAt: number
  errorUpdatedAt: number
  failureCount: number
  failureReason: TError | null
  isFetched: boolean
  isFetchedAfterMount: boolean
  isInitialLoading: boolean
  isPaused: boolean
  isPending: boolean
  isPlaceholderData: boolean
  isRefetching: boolean
  isInvalidated: boolean
  refetch: () => Promise<TData | undefined>
  remove: () => void
}

export type QueryObserverListener<TData, TError> = (result: QueryObserverResult<TData, TError>) => void

export class QueryObserver<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> extends Subscribable<QueryObserverListener<TData, TError>> {
  private client: QueryClient
  private options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryKey>
  private currentQuery: any = null
  private currentResult: QueryObserverResult<TData, TError> | null = null
  private previousResult: QueryObserverResult<TData, TError> | null = null

  constructor(
    client: QueryClient,
    options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryKey>
  ) {
    super()
    this.client = client
    this.options = options
    this.updateQuery()
    
    // Subscribe to query updates
    if (this.currentQuery && typeof this.currentQuery.subscribe === 'function') {
      this.currentQuery.subscribe(this as any)
    }

    // Trigger initial/refetch on mount based on options
    if (this.currentQuery && typeof this.options.queryFn === 'function' && (this.options.enabled ?? true)) {
      const hasData = !!this.currentQuery.state.dataUpdatedAt
      const shouldRefetchOnMount = this.options.refetchOnMount === 'always' || (this.options.refetchOnMount === true && this.currentQuery.state.isStale)
      if (!hasData || shouldRefetchOnMount) {
        // Set loading state immediately
        this.currentQuery.state = {
          ...this.currentQuery.state,
          isLoading: true,
          isPending: true,
          status: 'loading',
          fetchStatus: 'fetching',
          isFetching: true,
        }
        this.updateResult()
        this.notifyListeners()
        
        // Use setTimeout to ensure the loading state is visible before fetching
        setTimeout(() => {
          this.refetch().catch(() => {})
        }, 0)
      }
    }
  }

  private updateQuery() {
    const queryKey = this.options.queryKey
    const prevQuery = this.currentQuery
    
    // Find or create query
    let query = this.client.getQueryCache().find(queryKey)
    if (!query) {
      // Create query if it doesn't exist
      query = this.client.getQueryCache().build(this.client, {
        queryKey,
        queryFn: this.options.queryFn,
        enabled: this.options.enabled,
        retry: this.options.retry,
        retryDelay: this.options.retryDelay,
        staleTime: this.options.staleTime,
        gcTime: this.options.gcTime,
        refetchOnWindowFocus: this.options.refetchOnWindowFocus,
        refetchOnReconnect: this.options.refetchOnReconnect,
        refetchInterval: this.options.refetchInterval,
        refetchIntervalInBackground: this.options.refetchIntervalInBackground,
        refetchOnMount: this.options.refetchOnMount,
        meta: this.options.meta,
        initialData: this.options.initialData,
        placeholderData: this.options.placeholderData,
        structuralSharing: this.options.structuralSharing,
        throwOnError: this.options.throwOnError,
        select: this.options.select,
      }) as any
    }

    this.currentQuery = query
    const queryChanged = prevQuery && prevQuery !== this.currentQuery
    if (queryChanged && this.options.keepPreviousData && this.previousResult) {
      // retain previous data while loading new key
      this.currentResult = {
        ...this.previousResult,
        isLoading: true,
        isFetching: true,
        status: 'loading',
        fetchStatus: 'fetching',
        isStale: true,
        refetch: this.refetch.bind(this),
        remove: this.remove.bind(this),
      }
      this.notifyListeners()
    }
    if (this.currentQuery && typeof this.currentQuery.subscribe === 'function') {
      this.currentQuery.subscribe(this as any)
    }
    this.updateResult()
  }

  private updateResult() {
    if (!this.currentQuery) {
      this.currentResult = this.getDefaultResult()
      return
    }

    const state = this.currentQuery.state
    const result: QueryObserverResult<TData, TError> = {
      data: state.data as TData | undefined,
      error: state.error as TError | null,
      isError: state.isError,
      isLoading: state.isLoading,
      isSuccess: state.isSuccess,
      isFetching: state.isFetching,
      isStale: state.isStale,
      status: state.status,
      fetchStatus: state.fetchStatus,
      dataUpdatedAt: state.dataUpdatedAt,
      errorUpdatedAt: state.errorUpdatedAt,
      failureCount: state.failureCount,
      failureReason: state.failureReason as TError | null,
      isFetched: state.isFetched,
      isFetchedAfterMount: state.isFetchedAfterMount,
      isInitialLoading: state.isInitialLoading,
      isPaused: state.isPaused,
      isPending: state.isPending,
      isPlaceholderData: state.isPlaceholderData,
      isRefetching: state.isRefetching,
      isInvalidated: state.isInvalidated,
      refetch: this.refetch.bind(this),
      remove: this.remove.bind(this),
    }

    this.currentResult = result
  }

  private getDefaultResult(): QueryObserverResult<TData, TError> {
    return {
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      isSuccess: false,
      isFetching: false,
      isStale: true,
      status: 'idle',
      fetchStatus: 'idle',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetched: false,
      isFetchedAfterMount: false,
      isInitialLoading: false,
      isPaused: false,
      isPending: true,
      isPlaceholderData: false,
      isRefetching: false,
      isInvalidated: false,
      refetch: this.refetch.bind(this),
      remove: this.remove.bind(this),
    }
  }

  getCurrentResult(): QueryObserverResult<TData, TError> {
    if (!this.currentResult) {
      this.updateResult()
    }
    return this.currentResult!
  }

  getOptimisticResult(_options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryKey>): QueryObserverResult<TData, TError> {
    // For now, just return current result
    // In a full implementation, this would handle optimistic updates
    return this.getCurrentResult()
  }

  setOptions(newOptions: QueryObserverOptions<TQueryFnData, TError, TData, TQueryKey>) {
    // Cache previous result for keepPreviousData handling on key change
    this.previousResult = this.currentResult
    this.options = newOptions
    this.updateQuery()
    this.notifyListeners()
  }

  private async refetch(): Promise<TData | undefined> {
    if (!this.currentQuery) {
      return undefined
    }

    try {
      // For now, just return cached data
      // In a full implementation, this would trigger a new fetch
      const data = await this.currentQuery.fetch()
      this.updateResult()
      this.notifyListeners()
      return data as TData | undefined
    } catch (error) {
      this.updateResult()
      this.notifyListeners()
      throw error
    }
  }

  private remove() {
    if (this.currentQuery) {
      const gc = this.currentQuery.options?.gcTime ?? 5 * 60 * 1000
      const toRemove = this.currentQuery
      setTimeout(() => {
        // Only remove if still same query and not re-used
        this.client.getQueryCache().remove(toRemove)
      }, Math.max(0, gc))
      this.currentQuery = null
      this.updateResult()
      this.notifyListeners()
    }
  }

  private notifyListeners() {
    if (this.currentResult) {
      this.notify(this.currentResult)
    }
  }

  subscribe(listener: QueryObserverListener<TData, TError>) {
    const unsubscribe = super.subscribe(listener)
    
    // Ensure result is up to date and notify immediately
    this.updateResult()
    this.notifyListeners()
    
    return unsubscribe
  }

  // Method to be called by Query when its state changes
  onQueryUpdate() {
    this.updateResult()
    this.notifyListeners()
  }
}
