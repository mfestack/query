import type { Persistor } from './createPersistor'
import type { QueryClient, DehydrateOptions } from '../../types'
import { dehydrate, hydrate } from '../../hydration/hydration'

export interface PersistQueryClientOptions {
  queryClient: QueryClient
  persistor: Persistor
  dehydrateOptions?: DehydrateOptions
  maxAge?: number
}

export async function persistQueryClient({
  queryClient,
  persistor,
  dehydrateOptions,
  maxAge = 24 * 60 * 60 * 1000,
}: PersistQueryClientOptions): Promise<void> {
  // Try restore first (handle errors gracefully)
  try {
    const restored = await persistor.restoreClient()
    if (restored && Date.now() - restored.timestamp < maxAge) {
      hydrate(queryClient, restored.data as any)
    }
  } catch (error) {
    // Silently ignore restore errors (storage may not be available)
    console.warn('Failed to restore persisted cache:', error)
  }

  // Subscribe to cache changes (simple throttle via microtask)
  let scheduled = false
  const run = async () => {
    scheduled = false
    try {
      const data = dehydrate(queryClient, dehydrateOptions)
      await persistor.persistClient({
        timestamp: Date.now(),
        version: 1,
        data,
      } as any)
    } catch (error) {
      // Silently ignore persist errors (storage may be full or unavailable)
      console.warn('Failed to persist cache:', error)
    }
  }

  queryClient.getQueryCache().subscribe(() => {
    if (!scheduled) {
      scheduled = true
      queueMicrotask(run)
    }
  })

  // Ensure an initial snapshot is persisted immediately
  await run()
}
