'use client'

import { useQuery } from '@mfestack/react'
import { fetchUser } from '../../lib/utils'

interface UserDemoProps {
  userId: string
}

export function UserDemo({ userId }: UserDemoProps) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 60 * 1000, // 1 minute
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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isFetching && <span className="text-sm text-blue-500">🔄 Refetching...</span>}
      </div>
      <div className="bg-white p-4 rounded border">
        <div className="font-semibold text-lg">{data.name}</div>
        <div className="text-sm text-gray-600">{data.email}</div>
        <div className="text-sm text-gray-500 mt-2">
          <div>Company: {data.company}</div>
          <div>City: {data.city}</div>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2">
        {isLoading ? '⏳ Client loading...' : '✅ Hydrated from server (no refetch!)'}
      </div>
    </div>
  )
}

