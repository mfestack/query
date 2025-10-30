import { useCallback, useState } from 'react'
import type { MutationOptions } from '@mfestack/core'

export interface UseMutationResult<TData = unknown, TError = Error, TVariables = unknown> {
  mutate: (variables: TVariables) => Promise<TData | undefined>
  data: TData | undefined
  error: TError | null
  isLoading: boolean
}

export function useMutation<TData = unknown, TError = Error, TVariables = unknown>(
  options: MutationOptions<TData, TError, TVariables>
): UseMutationResult<TData, TError, TVariables> {
  const [data, setData] = useState<TData | undefined>(undefined)
  const [error, setError] = useState<TError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await options.mutationFn(variables)
      setData(result as TData)
      options.onSuccess?.(result as TData, variables, undefined)
      return result as TData
    } catch (err) {
      setError(err as TError)
      options.onError?.(err as TError, variables, undefined)
      throw err
    } finally {
      setIsLoading(false)
      options.onSettled?.(data, error, variables, undefined)
    }
  }, [options, data, error])

  return { mutate, data, error, isLoading }
}


