/* istanbul ignore file */

// Re-export core
export * from '@mfestack/core'

// Minimal React adapter surface for initial integration
export { QueryClientProvider } from './context/QueryClientProvider'
export type { QueryClientProviderProps } from './context/QueryClientProvider'

export { useQueryClient } from './hooks/useQueryClient'
export { useQuery } from './hooks/useQuery'
export { useMutation } from './hooks/useMutation'
export { useIsFetching } from './hooks/useIsFetching'
export { useIsMutating } from './hooks/useIsMutating'
export { useInfiniteQuery } from './hooks/useInfiniteQuery'
