import { useEffect, useState } from 'react'
import { useQueryClient } from './useQueryClient'

export interface MetricsSnapshot {
  queriesFetched: number
  queriesSucceeded: number
  queriesFailed: number
  cacheInvalidations: number
  cacheClears: number
  mutationsStarted: number
  mutationsSucceeded: number
  mutationsFailed: number
  lastUpdatedAt: number
}

export function useMetrics(): MetricsSnapshot {
  const client = useQueryClient()
  const [snapshot, setSnapshot] = useState<MetricsSnapshot>(client.metrics.getSnapshot())

  useEffect(() => {
    const unsub = client.metrics.subscribe(setSnapshot)
    return unsub
  }, [client])

  return snapshot
}


