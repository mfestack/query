import { QueryClient } from '@mfestack/core'

// In Remix, each request gets its own loader context, so we create
// a fresh QueryClient per request. This ensures data isolation between users and requests.
export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  })
}

