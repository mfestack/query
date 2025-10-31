import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import type { QueryKey, InfiniteQueryOptions } from '@mfestack/core'

export interface UseInfiniteQueryResult<TData = unknown, TError = Error> {
  data: TData[]
  error: TError | null
  isLoading: boolean
  isFetching: boolean
  fetchNextPage: () => Promise<void>
  fetchPreviousPage: () => Promise<void>
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function useInfiniteQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  options: InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseInfiniteQueryResult<TData, TError> {
  const [pages, setPages] = useState<TData[]>([])
  const [error, setError] = useState<TError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const allPagesRef = useRef<TQueryFnData[]>([])
  const pageParamsRef = useRef<unknown[]>([])
  const nextPageParamRef = useRef<unknown | undefined>(options.initialPageParam)
  const prevPageParamRef = useRef<unknown | undefined>(undefined)
  const initializedRef = useRef(false)

  // Store options in refs to avoid recreating callbacks
  const optionsRef = useRef(options)
  optionsRef.current = options
  
  // Capture initial page param in a ref to ensure we use the correct value on mount
  const initialPageParamRef = useRef(options.initialPageParam)
  initialPageParamRef.current = options.initialPageParam

  const baseKey = useMemo(() => options.queryKey, [options.queryKey])

  const runFetch = useCallback(async (pageParam: unknown, direction: 'forward' | 'backward') => {
    setIsFetching(true)
    try {
      const opts = optionsRef.current
      const ctx = { queryKey: baseKey as TQueryKey, pageParam, direction } as any
      const raw = await opts.queryFn(ctx)
      const mapped = (opts.select ? opts.select(raw as any) : (raw as any)) as TData
      if (direction === 'forward') {
        allPagesRef.current = [...allPagesRef.current, raw]
        pageParamsRef.current = [...pageParamsRef.current, pageParam]
        setPages(p => [...p, mapped])
        nextPageParamRef.current = opts.getNextPageParam(raw, allPagesRef.current, pageParam)
      } else {
        allPagesRef.current = [raw, ...allPagesRef.current]
        pageParamsRef.current = [pageParam, ...pageParamsRef.current]
        setPages(p => [mapped, ...p])
        prevPageParamRef.current = opts.getPreviousPageParam?.(raw, allPagesRef.current, pageParam)
      }
      setError(null)
    } catch (e) {
      setError(e as TError)
      throw e
    } finally {
      setIsFetching(false)
      setIsLoading(false)
    }
  }, [baseKey])

  const fetchNextPage = useCallback(async () => {
    const param = nextPageParamRef.current
    if (param === undefined) return
    await runFetch(param, 'forward')
  }, [runFetch])

  const fetchPreviousPage = useCallback(async () => {
    const param = prevPageParamRef.current
    if (param === undefined) return
    await runFetch(param, 'backward')
  }, [runFetch])

  // Initialize only once on mount
  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return
    initializedRef.current = true
    
    let mounted = true
    const init = async () => {
      setIsLoading(true)
      try {
        await runFetch(initialPageParamRef.current, 'forward')
      } catch {
        // handled via error state
      }
      if (!mounted) return
    }
    init()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const result = useMemo<UseInfiniteQueryResult<TData, TError>>(() => ({
    data: pages,
    error,
    isLoading,
    isFetching,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage: nextPageParamRef.current !== undefined,
    hasPreviousPage: prevPageParamRef.current !== undefined,
  }), [pages, error, isLoading, isFetching, fetchNextPage, fetchPreviousPage])

  return result
}


