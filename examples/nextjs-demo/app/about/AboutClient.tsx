'use client'

import { useQuery, useQueryClient } from '@mfestack/react'
import { fetchUser } from '../../lib/utils'
import { useEffect } from 'react'
import { hydrate } from '@mfestack/core'

export function AboutClient() {
  const queryClient = useQueryClient()
  
  // Hydrate from script tag if available
  useEffect(() => {
    const state = typeof window !== 'undefined' && (window as any).__MFESTACK_STATE_ABOUT__
    if (state) {
      hydrate(queryClient, state)
      delete (window as any).__MFESTACK_STATE_ABOUT__
    }
  }, [queryClient])

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', '2'],
    queryFn: () => fetchUser('2'),
  })

  if (isLoading) {
    return <div className="text-gray-500">Loading user...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>
  }

  if (!data) {
    return <div className="text-gray-500">No user data</div>
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">User from Server (Route Prefetch)</h2>
      <div className="space-y-2">
        <div className="font-semibold text-lg">{data.name}</div>
        <div className="text-sm text-gray-600">{data.email}</div>
        <div className="text-sm text-gray-500 mt-2">
          <div>Company: {data.company}</div>
          <div>City: {data.city}</div>
        </div>
        <div className="text-xs text-gray-400 mt-4">
          ✅ This data was prefetched on the server for this route and hydrated on the client.
          No loading spinner should appear on initial render!
        </div>
      </div>
    </div>
  )
}

