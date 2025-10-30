import { useEffect, useRef, useState, useMemo } from 'react'
import type { QueryKey, QueryObserverOptions, QueryObserverResult } from '@mfestack/core'
import { QueryObserver } from '@mfestack/core'
import { useQueryClient } from './useQueryClient'

export type UseQueryResult<TData = unknown, TError = Error> = QueryObserverResult<TData, TError>

export function useQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
  const client = useQueryClient()
  const [result, setResult] = useState<UseQueryResult<TData, TError>>(() => ({
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
    refetch: () => Promise.resolve(undefined),
    remove: () => {},
  }))

  const observerRef = useRef<QueryObserver<TQueryFnData, TError, TData, TQueryKey> | null>(null)
  const lastResultRef = useRef<UseQueryResult<TData, TError> | null>(null)

  // Memoize options to prevent infinite re-renders
  const memoizedOptions = useMemo(() => options, [
    options.queryKey,
    options.queryFn,
    options.enabled,
    options.retry,
    options.retryDelay,
    options.staleTime,
    options.gcTime,
    options.refetchOnWindowFocus,
    options.refetchOnReconnect,
    options.refetchInterval,
    options.refetchIntervalInBackground,
    options.refetchOnMount,
    options.meta,
    options.initialData,
    options.placeholderData,
    options.structuralSharing,
    options.throwOnError,
    options.select,
  ])

  // Create observer
  useEffect(() => {
    const observer = new QueryObserver(client, memoizedOptions)
    observerRef.current = observer

    // Subscribe to changes with shallow guard to prevent update loops
    const unsubscribe = observer.subscribe((newResult) => {
      const prev = lastResultRef.current
      const changed =
        !prev ||
        prev.data !== newResult.data ||
        prev.error !== newResult.error ||
        prev.status !== newResult.status ||
        prev.fetchStatus !== newResult.fetchStatus ||
        prev.isFetching !== newResult.isFetching ||
        prev.dataUpdatedAt !== newResult.dataUpdatedAt ||
        prev.errorUpdatedAt !== newResult.errorUpdatedAt

      if (changed) {
        lastResultRef.current = newResult
        setResult(newResult)
      }
    })

    return () => {
      unsubscribe()
      observerRef.current = null
    }
  }, [client, memoizedOptions])

  return result
}


