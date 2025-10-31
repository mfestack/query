// PersistPlugin - Persists cache to storage using the AppStackPlugin lifecycle
// This plugin wraps the new Persistor infrastructure for backward compatibility
import type {
  AppStackPlugin,
  PersistPluginOptions,
  QueryClient,
  DehydratedState,
} from '../types';
import { createLocalStoragePersistor } from './persist/storage/localStoragePersistor';
import { dehydrate, hydrate } from '../hydration/hydration';
import type { PersistedClient } from './persist/createPersistor';
import type { QueryCache } from '../query/QueryCache';

export function persistPlugin(
  options: PersistPluginOptions = {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined as any,
    key: 'mfestack-query-cache',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  }
): AppStackPlugin {
  const { storage, key, maxAge } = options;
  
  // Use the new Persistor infrastructure internally
  const persistor = createLocalStoragePersistor({
    key,
    storage,
  });

  let throttledPersist: NodeJS.Timeout | null = null;
  let cachedClient: QueryClient | null = null;
  
  const persistCache = () => {
    if (!cachedClient || throttledPersist) return
    throttledPersist = setTimeout(() => {
      throttledPersist = null
      const state = dehydrate(cachedClient!)
      const data: PersistedClient = {
        timestamp: Date.now(),
        version: 1,
        data: state,
      }
      persistor.persistClient(data).catch((err) => {
        console.warn('Failed to persist cache:', err)
      })
    }, 1000) // Throttle to 1 second
  }

  return {
    id: 'persist',

    onInit(client: QueryClient) {
      // Store client reference for onCacheUpdate
      cachedClient = client;
      
      // Restore from storage on init
      persistor.restoreClient().then((restored) => {
        if (!restored) return
        
        const now = Date.now()
        if (maxAge && now - restored.timestamp < maxAge) {
          hydrate(client, restored.data as DehydratedState)
        } else {
          // Data is stale, remove it
          persistor.removeClient()
        }
      }).catch((error) => {
        console.warn('Failed to restore persisted cache:', error)
      })
    },

    onRestore(client: QueryClient, _state: DehydratedState) {
      // Restore from storage (same as onInit for consistency)
      persistor.restoreClient().then((restored) => {
        if (!restored) return
        
        const now = Date.now()
        if (maxAge && now - restored.timestamp < maxAge) {
          hydrate(client, restored.data as DehydratedState)
        } else {
          persistor.removeClient()
        }
      }).catch((error) => {
        console.warn('Failed to restore persisted cache:', error)
      })
    },

    onPersist(_client: QueryClient, state: DehydratedState) {
      // Use the persistor for consistency
      const data: PersistedClient = {
        timestamp: Date.now(),
        version: 1,
        data: state,
      }
      persistor.persistClient(data).catch((err) => {
        console.warn('Failed to persist cache:', err)
      })
    },

    onCacheUpdate(_cache: QueryCache) {
      // Throttled persist on cache updates
      persistCache()
    },
  };
}
