/* istanbul ignore file */

// Re-export core
export * from '@mfestack/core'

// Minimal React adapter surface for initial integration
export { QueryClientProvider } from './context/QueryClientProvider'
export type { QueryClientProviderProps } from './context/QueryClientProvider'

export { useQueryClient } from './hooks/useQueryClient'
export { useQuery } from './hooks/useQuery'
export { useMutation } from './hooks/useMutation'
