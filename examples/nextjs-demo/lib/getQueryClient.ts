import { QueryClient } from '@mfestack/core'
import { cache } from 'react'

// Create a QueryClient instance per request to avoid sharing state between requests
// This ensures data isolation between users and requests
export const getQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  })
})

