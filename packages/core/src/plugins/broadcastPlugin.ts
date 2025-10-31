// BroadcastPlugin - Synchronizes cache between tabs/windows with scoped channels and throttling
import type { AppStackPlugin, BroadcastPluginOptions, QueryClient } from '../types'
import type { QueryCache } from '../query/QueryCache'
import { dehydrate } from '../hydration/hydration'

interface BroadcastMessage {
  type: 'cache-update'
  state: unknown
  timestamp: number
  origin: string
  scope?: string
}

export function broadcastPlugin(options: BroadcastPluginOptions = {}): AppStackPlugin {
  const {
    channel: baseChannel = 'mfestack-query-sync',
    scope,
    throttleMs = 1000,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options

  // Build scoped channel name
  const channelName = scope ? `${baseChannel}-${scope}` : baseChannel
  
  let broadcastChannel: BroadcastChannel | null = null
  let client: QueryClient | null = null
  let originId: string = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Throttling state
  let throttleTimer: ReturnType<typeof setTimeout> | null = null
  let pendingState: unknown = null
  let lastBroadcastState: string | null = null

  const broadcastState = async () => {
    if (!broadcastChannel || !client) return
    
    try {
      const dehydrated = dehydrate(client)
      const stateString = serialize(dehydrated)
      
      // Deduplication: Skip if state hasn't changed
      if (stateString === lastBroadcastState) {
        pendingState = null
        return
      }
      
      const message: BroadcastMessage = {
        type: 'cache-update',
        state: dehydrated,
        timestamp: Date.now(),
        origin: originId,
        scope,
      }
      
      broadcastChannel.postMessage(serialize(message))
      lastBroadcastState = stateString
      pendingState = null
    } catch (error) {
      console.warn('Failed to broadcast cache update:', error)
      pendingState = null
    }
  }

  const scheduleBroadcast = () => {
    if (!client) return
    
    // Capture current state
    try {
      pendingState = dehydrate(client)
    } catch (error) {
      console.warn('Failed to dehydrate cache for broadcast:', error)
      return
    }
    
    // Clear existing throttle timer
    if (throttleTimer) {
      clearTimeout(throttleTimer)
    }
    
    // Schedule broadcast after throttle delay
    throttleTimer = setTimeout(() => {
      throttleTimer = null
      broadcastState()
    }, throttleMs)
  }

  return {
    id: 'broadcast',
    
    onInit(initClient: QueryClient) {
      client = initClient
      
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          broadcastChannel = new BroadcastChannel(channelName)
          
          broadcastChannel.onmessage = (event) => {
            try {
              const data = deserialize(event.data) as BroadcastMessage
              
              // Ignore messages from same origin (avoid feedback loop)
              if (data.origin === originId) {
                return
              }
              
              // Validate scope match (if scoped)
              if (scope && data.scope !== scope) {
                return
              }
              
              // Process cache update
              if (data.type === 'cache-update' && data.state && client) {
                // Merge state instead of full replace to avoid conflicts
                client.hydrate(data.state as any)
              }
            } catch (error) {
              console.warn('Failed to process broadcast message:', error)
            }
          }
        } catch (error) {
          console.warn('Failed to create broadcast channel:', error)
        }
      }
    },

    onCacheUpdate(_cache: QueryCache) {
      // Throttle rapid cache updates
      scheduleBroadcast()
    },

    dispose() {
      if (throttleTimer) {
        clearTimeout(throttleTimer)
        throttleTimer = null
      }
      
      // Broadcast final state before cleanup
      if (pendingState && broadcastChannel && client) {
        try {
          const message: BroadcastMessage = {
            type: 'cache-update',
            state: pendingState,
            timestamp: Date.now(),
            origin: originId,
            scope,
          }
          broadcastChannel.postMessage(serialize(message))
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
      
      if (broadcastChannel) {
        broadcastChannel.close()
        broadcastChannel = null
      }
      
      client = null
      pendingState = null
      lastBroadcastState = null
    },
  }
}
