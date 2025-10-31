// Query - Represents a single query instance
import type { QueryKey, QueryOptions, QueryState, QueryObserver } from '../types'
import type { EventBus } from '../utils/EventBus'
import { retryer as globalRetryer, Retryer } from '../managers/Retryer'
import { hashKey } from '../utils/helpers'

export class Query<TData = unknown, TError = Error, TVariables = unknown, TQueryKey extends QueryKey = QueryKey> {
  public queryKey: TQueryKey
  public queryHash: string
  public options: QueryOptions<TData, TError, TVariables, TQueryKey>
  public state: QueryState<TData, TError>
  public observers: QueryObserver[] = []
  private abortController: AbortController | null = null
  private retryer: Retryer = globalRetryer
  private staleTimer: ReturnType<typeof setTimeout> | null = null
  private eventBus?: EventBus

  setEventBus(eventBus: EventBus) {
    this.eventBus = eventBus
  }

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
    // Clear any scheduled GC in future when implementing cache-level GC
    // If data exists and staleTime configured, ensure stale timer is active
    this.scheduleStaleTimer()
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
      // If no observers remain, allow stale timer to continue; GC handled by cache
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
    this.notifyObservers()
    
    // Emit EventBus event for fetch start
    if (this.eventBus) {
      this.eventBus.emit('query:updated', { query: this as any, state: this.state }, 'normal')
    }

    const controller = new AbortController()
    this.abortController = controller
    try {
      const exec = async () => this.options.queryFn!({
        queryKey: this.queryKey,
        signal: controller.signal,
      } as any) as Promise<TData>

      const result = await this.retryer.run<TData>(exec as any, {
        retry: typeof this.options.retry === 'number' || typeof this.options.retry === 'boolean' ? (this.options.retry as any) : false,
        retryDelay: (attempt) => {
          const rd = this.options.retryDelay
          if (typeof rd === 'number') return rd
          if (typeof rd === 'function') return rd(attempt, undefined as unknown as TError)
          return undefined as unknown as number
        },
      })

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
      this.notifyObservers()
      
      // Emit EventBus event for successful fetch
      if (this.eventBus) {
        this.eventBus.emit('query:updated', { query: this as any, state: this.state }, 'normal')
      }
      
      this.scheduleStaleTimer()
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
      this.notifyObservers()
      
      // Emit EventBus event for failed fetch
      if (this.eventBus) {
        this.eventBus.emit('query:updated', { query: this as any, state: this.state }, 'normal')
      }
      
      throw err
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
      this.state = {
        ...this.state,
        isFetching: false,
        fetchStatus: 'idle',
      }
      this.notifyObservers()
    }
    this.retryer.cancel()
  }

  private scheduleStaleTimer() {
    if (this.staleTimer) {
      clearTimeout(this.staleTimer)
      this.staleTimer = null
    }
    const staleTime = this.options.staleTime ?? 0
    if (staleTime > 0) {
      this.staleTimer = setTimeout(() => {
        this.state = { ...this.state, isStale: true }
        this.notifyObservers()
      }, staleTime)
    } else {
      // immediate stale by default if no staleTime
      this.state = { ...this.state, isStale: true }
      this.notifyObservers()
    }
  }

  invalidate(): void {
    // This will be implemented when we create the QueryManager
  }

  private notifyObservers() {
    this.observers.forEach(observer => {
      if (observer && typeof (observer as any).onQueryUpdate === 'function') {
        ;(observer as any).onQueryUpdate()
      }
    })
  }

  remove(): void {
    // This will be implemented when we create the QueryManager
  }
}
