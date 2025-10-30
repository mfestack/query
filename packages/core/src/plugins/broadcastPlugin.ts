// BroadcastPlugin - Synchronizes cache between tabs/windows
import type { AppStackPlugin, BroadcastPluginOptions, QueryClient } from '../types'
import type { QueryCache } from '../query/QueryCache'

export function broadcastPlugin(options: BroadcastPluginOptions = {}): AppStackPlugin {
  const {
    channel = 'mfestack-query-sync',
    deserialize = JSON.parse,
  } = options

  let broadcastChannel: BroadcastChannel | null = null

  return {
    id: 'broadcast',
    
    onInit(client: QueryClient) {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          broadcastChannel = new BroadcastChannel(channel)
          
          broadcastChannel.onmessage = (event) => {
            try {
              const data = deserialize(event.data)
              if (data.type === 'cache-update' && data.state) {
                client.hydrate(data.state)
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
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({
            type: 'cache-update',
            timestamp: Date.now(),
          })
        } catch (error) {
          console.warn('Failed to broadcast cache update:', error)
        }
      }
    },

    dispose() {
      if (broadcastChannel) {
        broadcastChannel.close()
        broadcastChannel = null
      }
    },
  }
}
