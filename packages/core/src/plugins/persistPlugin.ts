// PersistPlugin - Persists cache to storage
import type {
  AppStackPlugin,
  PersistPluginOptions,
  QueryClient,
  DehydratedState,
} from '../types';

export function persistPlugin(
  options: PersistPluginOptions = {
    storage: window.localStorage,
    key: 'mfestack-query-cache',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  }
): AppStackPlugin {
  const { storage, key, maxAge, serialize, deserialize } = options;

  return {
    id: 'persist',

    onInit(client: QueryClient) {
      // Restore from storage on init
      try {
        const stored = storage.getItem(key || '');
        if (stored) {
          const data = deserialize?.(stored) as unknown as { timestamp: number, state: DehydratedState };
          const now = Date.now();

          // Check if data is still valid
          if (data && data.timestamp && maxAge && now - data.timestamp < maxAge ) {
            client.hydrate(data.state);
          } else {
            // Data is stale, remove it
            storage.removeItem(key || '');
          }
        }
      } catch (error) {
        console.warn('Failed to restore persisted cache:', error);
      }
    },

    onRestore(client: QueryClient, _state: DehydratedState) {
      // Restore from storage
      try {
        const stored = storage.getItem(key || '');
        if (stored) {
          const data = deserialize?.(stored) as unknown as { timestamp: number, state: DehydratedState };
          const now = Date.now();

          // Check if data is still valid
          if (data && data.timestamp && maxAge && now - data.timestamp < maxAge ) {
            client.hydrate(data.state);
          } else {
            // Data is stale, remove it
            storage.removeItem(key || '');
          }
        }
      } catch (error) {
        console.warn('Failed to restore persisted cache:', error);
      }
    },

    onPersist(_client: QueryClient, state: DehydratedState) {
      try {
        const data = {
          state,
          timestamp: Date.now(),
        };
        storage.setItem(key || '', serialize?.(data) || '');
      } catch (error) {
        console.warn('Failed to persist cache:', error);
      }
    },

    onCacheUpdate() {
      // Persist cache on every update
      // This will be called by the QueryClient when cache changes
    },
  };
}
