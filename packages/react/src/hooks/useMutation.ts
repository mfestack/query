import { useCallback, useEffect, useState, useRef } from 'react'
import type { MutationOptions } from '@mfestack/core'
import { useQueryClient } from './useQueryClient'

export interface UseMutationResult<TData = unknown, TError = Error, TVariables = unknown> {
  mutate: (variables: TVariables) => Promise<TData | undefined>
  data: TData | undefined
  error: TError | null
  isLoading: boolean
}

export function useMutation<TData = unknown, TError = Error, TVariables = unknown>(
  options: MutationOptions<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables> {
  const client = useQueryClient()
  const [data, setData] = useState<TData | undefined>(undefined)
  const [error, setError] = useState<TError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const mutationRef = useRef<any>(null)

  // Build mutation in cache on mount
  useEffect(() => {
    mutationRef.current = client.mutationCache.build(client, options)
    
    // Initial state sync
    const state = mutationRef.current.state
    setData(state.data as TData | undefined)
    setError(state.error as TError | null)
    setIsLoading(state.isLoading)

    // Subscribe to mutation cache updates
    const unsubscribeCache = client.mutationCache.subscribe((event: any) => {
      if (event.mutation === mutationRef.current || 
          (mutationRef.current && event.mutation?.mutationKey && 
           JSON.stringify(event.mutation.mutationKey) === JSON.stringify(mutationRef.current.mutationKey))) {
        const currentState = mutationRef.current.state
        setData(currentState.data as TData | undefined)
        setError(currentState.error as TError | null)
        setIsLoading(currentState.isLoading)
      }
    })

    // Subscribe to mutation observer pattern
    const observer = {
      onMutationUpdate: () => {
        if (mutationRef.current) {
          const currentState = mutationRef.current.state
          setData(currentState.data as TData | undefined)
          setError(currentState.error as TError | null)
          setIsLoading(currentState.isLoading)
        }
      }
    }
    const unsubscribeMutation = mutationRef.current.subscribe(observer)

    return () => {
      unsubscribeCache()
      unsubscribeMutation()
    }
  }, [client, options.mutationKey])

  // Sync state from mutation periodically (fallback)
  useEffect(() => {
    if (!mutationRef.current) return

    const interval = setInterval(() => {
      const state = mutationRef.current.state
      setData(state.data as TData | undefined)
      setError(state.error as TError | null)
      setIsLoading(state.isLoading)
    }, 100)

    return () => clearInterval(interval)
  }, [mutationRef.current])

  const mutate = useCallback(async (variables: TVariables) => {
    if (!mutationRef.current) {
      mutationRef.current = client.mutationCache.build(client, options)
    }
    
    try {
      const result = await mutationRef.current.execute(variables)
      // Update state after execution
      const state = mutationRef.current.state
      setData(state.data as TData | undefined)
      setError(state.error as TError | null)
      setIsLoading(state.isLoading)
      return result as TData
    } catch (err) {
      // Update state even on error
      if (mutationRef.current) {
        const state = mutationRef.current.state
        setData(state.data as TData | undefined)
        setError(state.error as TError | null)
        setIsLoading(state.isLoading)
      }
      throw err
    }
  }, [client, options])

  return { mutate, data, error, isLoading }
}


