import { useEffect, useState } from 'react'
import type { QueryFilters } from '@mfestack/core'
import { useQueryClient } from './useQueryClient'

export function useIsFetching(filters?: QueryFilters): number {
  const client = useQueryClient()
  const [count, setCount] = useState(() => client.isFetching(filters))

  useEffect(() => {
    const unsubscribe = client.getQueryCache().subscribe(() => {
      setCount(client.isFetching(filters))
    })
    return unsubscribe
  }, [client, filters?.queryKey, filters?.type, filters?.exact, filters?.stale, filters?.fetchStatus])

  return count
}

