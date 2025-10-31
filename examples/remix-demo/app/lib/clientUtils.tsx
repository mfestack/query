import { QueryClient, QueryClientProvider } from '@mfestack/react'
import { useState, useEffect } from 'react'
import type { DehydratedState } from '@mfestack/core'

interface QueryClientProviderWrapperProps {
  children: React.ReactNode
  dehydratedState?: DehydratedState
}

// Client-side QueryClient provider with hydration
export function QueryClientProviderWrapper({ children, dehydratedState }: QueryClientProviderWrapperProps) {
  // Create a client instance (singleton on client)
  const [queryClient] = useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
        },
      },
    })
  })

  // Hydrate with server-dehydrated state if available
  useEffect(() => {
    const state = dehydratedState || (typeof window !== "undefined" && (window as any).__MFESTACK_STATE__)
    if (state) {
      queryClient.hydrate(state)
      // Clean up the global state after hydration
      if (typeof window !== "undefined" && (window as any).__MFESTACK_STATE__) {
        delete (window as any).__MFESTACK_STATE__
      }
    }
  }, [queryClient, dehydratedState])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
