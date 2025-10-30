// Test QueryClient for testing
import { createQueryClient } from '@mfestack/core'
import type { QueryClient } from '@mfestack/core'

export function createTestQueryClient(): QueryClient {
  return createQueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
