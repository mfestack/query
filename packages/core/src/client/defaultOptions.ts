// Default options for AppStack Query
import type { DefaultOptions, QueryOptions, MutationOptions } from '../types'

export const defaultQueryOptions: Partial<QueryOptions> = {
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 0,
  gcTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: true,
  refetchInterval: false,
  refetchIntervalInBackground: false,
  notifyOnChangeProps: 'all',
  structuralSharing: true,
  throwOnError: false,
  enabled: true,
}

export const defaultMutationOptions: Partial<MutationOptions> = {
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  throwOnError: false,
}

export const defaultOptions: DefaultOptions = {
  queries: defaultQueryOptions,
  mutations: defaultMutationOptions,
}
