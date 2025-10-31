import type { QueryClient, DehydrateOptions } from '../../types'
import { dehydrate, hydrate } from '../../hydration/hydration'
import type { Persistor } from '../persist/createPersistor'
import { requestIdleCallback, cancelIdleCallback } from '../../utils/adapters'

interface SyncCoordinatorOptions {
  queryClient: QueryClient
  persistor: Persistor
  dehydrateOptions?: DehydrateOptions
  maxAge?: number
  broadcast?: {
    channel?: string
    scope?: string
    throttleMs?: number
    serialize?: (data: unknown) => string
    deserialize?: (data: string) => unknown
  }
}

interface BroadcastMessage {
  type: 'cache-update'
  state: unknown
  timestamp: number
  origin: string
  scope?: string
}

export function createSyncCoordinator({
  queryClient,
  persistor,
  dehydrateOptions,
  maxAge = 24 * 60 * 60 * 1000,
  broadcast,
}: SyncCoordinatorOptions) {
  const channelName = broadcast?.scope
    ? `${broadcast.channel ?? 'mfestack-query-sync'}-${broadcast.scope}`
    : broadcast?.channel ?? 'mfestack-query-sync'

  const serialize = broadcast?.serialize ?? JSON.stringify
  const deserialize = broadcast?.deserialize ?? JSON.parse
  const throttleMs = broadcast?.throttleMs ?? 1000

  let broadcastChannel: BroadcastChannel | null = null
  let unsubscribe: (() => void) | null = null
  let idleCallbackId: number | null = null
  let syncInProgress = false
  let pendingSync = false
  const originId = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
  let lastStateString: string | null = null
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 500

  // Race prevention: ensure only one sync runs at a time
  const runSync = async () => {
    // Prevent concurrent syncs
    if (syncInProgress) {
      pendingSync = true
      return
    }

    syncInProgress = true
    pendingSync = false

    try {
      // 1) Persist first to storage
      const state = dehydrate(queryClient, dehydrateOptions)
      await persistor.persistClient({
        timestamp: Date.now(),
        version: 1,
        data: state,
      })

      // 2) Then broadcast (if available), dedupe identical payloads
      if (broadcastChannel) {
        const stateString = serialize(state)
        if (stateString !== lastStateString) {
          const msg: BroadcastMessage = {
            type: 'cache-update',
            state,
            timestamp: Date.now(),
            origin: originId,
            scope: broadcast?.scope,
          }
          broadcastChannel.postMessage(serialize(msg))
          lastStateString = stateString
        }
      }

      // Reset retry count on success
      retryCount = 0
    } catch (err) {
      // Best-effort: never throw
      // Retry on failure with exponential backoff
      if (retryCount < maxRetries) {
        retryCount++
        setTimeout(() => {
          syncInProgress = false
          void runSync()
        }, retryDelay * retryCount)
        return
      }
      // After max retries, reset and continue
      retryCount = 0
    } finally {
      syncInProgress = false
      
      // If there was a pending sync while we were running, schedule another one
      if (pendingSync) {
        schedule()
      }
    }
  }

  const schedule = () => {
    // Cancel any pending idle callback
    if (idleCallbackId !== null) {
      cancelIdleCallback(idleCallbackId)
      idleCallbackId = null
    }

    // Use requestIdleCallback for better performance, with fallback to setTimeout
    idleCallbackId = requestIdleCallback(
      () => {
        idleCallbackId = null
        void runSync()
      },
      { timeout: throttleMs }
    )
  }

  const start = async () => {
    // Restore from persistence first
    try {
      const restored = await persistor.restoreClient()
      if (restored && Date.now() - restored.timestamp < maxAge) {
        hydrate(queryClient, restored.data as any)
      } else if (restored && Date.now() - restored.timestamp >= maxAge) {
        await persistor.removeClient()
      }
    } catch (err) {
      // ignore restore errors
      // eslint-disable-next-line no-console
      console.warn('SyncCoordinator restore failed:', err)
    }

    // Setup broadcast channel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcastChannel = new BroadcastChannel(channelName)
        broadcastChannel.onmessage = (event) => {
          try {
            const data = deserialize(event.data) as BroadcastMessage
            if (data.type !== 'cache-update') return
            if (data.origin === originId) return
            if (broadcast?.scope && data.scope !== broadcast.scope) return
            hydrate(queryClient, data.state as any)
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('SyncCoordinator failed to process broadcast:', e)
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('SyncCoordinator failed to open BroadcastChannel:', e)
      }
    }

    // Subscribe to cache updates
    unsubscribe = queryClient.getQueryCache().subscribe(() => {
      schedule()
    })

    // Persist + broadcast initial snapshot
    await runSync()
  }

  const stop = async () => {
    // Cancel any pending idle callback
    if (idleCallbackId !== null) {
      cancelIdleCallback(idleCallbackId)
      idleCallbackId = null
    }
    
    // Wait for any in-progress sync to complete (with timeout)
    if (syncInProgress) {
      const timeout = 5000 // 5 second timeout
      const startTime = Date.now()
      while (syncInProgress && Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (broadcastChannel) {
      try {
        broadcastChannel.close()
      } catch {}
      broadcastChannel = null
    }
  }

  return { start, stop }
}


