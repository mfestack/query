// Factory function to create QueryClient instance
import type { QueryClientConfig, QueryClient } from '../types'
import { QueryClient as QueryClientClass } from './QueryClient'
import { defaultOptions } from './defaultOptions'

export function createQueryClient(config: QueryClientConfig = {}): QueryClient {
  const {
    defaultOptions: userDefaultOptions = {},
    queryCache,
    mutationCache,
    logger,
    plugins = [],
  } = config

  // Merge default options with user options
  const mergedDefaultOptions = {
    queries: {
      ...defaultOptions.queries,
      ...userDefaultOptions.queries,
    },
    mutations: {
      ...defaultOptions.mutations,
      ...userDefaultOptions.mutations,
    },
  }

  // Create QueryClient instance
  const queryClient = new QueryClientClass({
    defaultOptions: mergedDefaultOptions,
    queryCache,
    mutationCache,
    logger,
  })

  // Register plugins
  plugins.forEach(plugin => {
    queryClient.use(plugin)
  })

  return queryClient
}
