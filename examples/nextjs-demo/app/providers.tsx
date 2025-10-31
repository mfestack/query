'use client'

import { QueryClient, QueryClientProvider } from '@mfestack/react'
import { useState, useEffect } from 'react'

export function Providers({ children, dehydratedState }: { children: React.ReactNode; dehydratedState?: unknown }) {
  // Create a client instance per request to avoid sharing state between requests
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
    const state = dehydratedState || (typeof window !== 'undefined' && (window as any).__MFESTACK_STATE__)
    if (state) {
      queryClient.hydrate(state as any)
      // Clean up the global state
      if (typeof window !== 'undefined') {
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

