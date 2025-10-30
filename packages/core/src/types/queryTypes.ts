// Query-related types for AppStack Query

export type QueryKey = readonly unknown[]

export type QueryFunction<T = unknown, TQueryKey extends QueryKey = QueryKey> = (
  context: QueryFunctionContext<TQueryKey>
) => T | Promise<T>

export interface QueryFunctionContext<TQueryKey extends QueryKey = QueryKey> {
  queryKey: TQueryKey
  signal?: AbortSignal
  meta?: QueryMeta
  pageParam?: unknown
  direction?: 'forward' | 'backward'
}

export interface QueryMeta {
  [key: string]: unknown
}

export type QueryStatus = 'idle' | 'loading' | 'error' | 'success'

export type FetchStatus = 'fetching' | 'paused' | 'idle'

export interface QueryState<TData = unknown, TError = Error> {
  data: TData | undefined
  dataUpdatedAt: number
  error: TError | null
  errorUpdatedAt: number
  failureCount: number
  failureReason: TError | null
  fetchStatus: FetchStatus
  isError: boolean
  isFetched: boolean
  isFetchedAfterMount: boolean
  isFetching: boolean
  isInitialLoading: boolean
  isLoading: boolean
  isInvalidated: boolean
  isPaused: boolean
  isPending: boolean
  isPlaceholderData: boolean
  isRefetching: boolean
  isStale: boolean
  isSuccess: boolean
  status: QueryStatus
  fetchMeta: FetchMeta | null
}

export interface FetchMeta {
  [key: string]: unknown
}

export interface QueryOptions<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> {
  queryKey: TQueryKey
  queryFn: QueryFunction<TQueryFnData, TQueryKey>
  enabled?: boolean
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
  retryDelay?: number | ((retryAttempt: number, error: TError) => number)
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean | 'always'
  refetchOnReconnect?: boolean | 'always'
  refetchInterval?: number | false
  refetchIntervalInBackground?: boolean
  refetchOnMount?: boolean | 'always'
  notifyOnChangeProps?: Array<keyof QueryState<TData, TError>> | 'all'
  meta?: QueryMeta
  initialData?: TData | (() => TData)
  placeholderData?: TData | (() => TData)
  structuralSharing?: boolean
  throwOnError?: boolean | ((error: TError) => boolean)
  select?: (data: TQueryFnData) => TData
}

export interface QueryObserverOptions<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> 
  extends QueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  notifyOnChangeProps?: Array<keyof QueryState<TData, TError>> | 'all'
}

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

export interface InfiniteQueryOptions<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>
  extends Omit<QueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryFn'> {
  queryFn: (context: QueryFunctionContext<TQueryKey> & { pageParam: unknown }) => TQueryFnData | Promise<TQueryFnData>
  initialPageParam: unknown
  getNextPageParam: (lastPage: TQueryFnData, allPages: TQueryFnData[], lastPageParam: unknown) => unknown
  getPreviousPageParam?: (firstPage: TQueryFnData, allPages: TQueryFnData[], firstPageParam: unknown) => unknown
  maxPages?: number
}

export interface QueryFilters {
  queryKey?: QueryKey
  exact?: boolean
  type?: 'all' | 'active' | 'inactive'
  stale?: boolean
  fetchStatus?: FetchStatus
  predicate?: (query: Query) => boolean
}

export interface QueryCacheNotifyEvent {
  type: 'added' | 'removed' | 'updated'
  query: Query
}

export interface Query {
  queryKey: QueryKey
  queryHash: string
  options: QueryOptions
  state: QueryState
  observers: QueryObserver[]
  subscribe: (observer: QueryObserver) => () => void
  fetch: () => Promise<unknown>
  invalidate: () => void
  remove: () => void
}

export interface QueryObserver {
  options: QueryObserverOptions
  getCurrentResult: () => QueryState
  subscribe: (callback: (result: QueryState) => void) => () => void
  destroy: () => void
}
