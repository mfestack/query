import { useEffect, useState } from 'react'
import type { MutationFilters } from '@mfestack/core'
import { useQueryClient } from './useQueryClient'

export function useIsMutating(filters?: MutationFilters): number {
  const client = useQueryClient()
  const [count, setCount] = useState(() => client.isMutating(filters))

  useEffect(() => {
    const unsubscribe = client.getMutationCache().subscribe(() => {
      setCount(client.isMutating(filters))
    })
    return unsubscribe
  }, [client])

  return count
}

