import type { QueryClient, DehydrateOptions } from '../../types'
import { dehydrate, hydrate } from '../../hydration/hydration'
import type { Persistor } from '../persist/createPersistor'

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
  let timer: ReturnType<typeof setTimeout> | null = null
  const originId = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
  let lastStateString: string | null = null

  const runSync = async () => {
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
    } catch (err) {
      // Best-effort: never throw
      // eslint-disable-next-line no-console
      console.warn('SyncCoordinator failed to sync cache:', err)
    }
  }

  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      void runSync()
    }, throttleMs)
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
    if (timer) clearTimeout(timer)
    timer = null
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


