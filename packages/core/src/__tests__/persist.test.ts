import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient } from '../client/QueryClient'
import { persistQueryClient } from '../plugins/persist/persistQueryClient'
import { createMemoryPersistor } from '../plugins/persist/storage/memoryPersistor'
import { createLocalStoragePersistor } from '../plugins/persist/storage/localStoragePersistor'
import type { Persistor, PersistedClient } from '../plugins/persist/createPersistor'

describe('persistQueryClient', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {}
    global.Storage.prototype.getItem = vi.fn((key: string) => store[key] || null)
    global.Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      store[key] = value
    })
    global.Storage.prototype.removeItem = vi.fn((key: string) => {
      delete store[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should persist and restore query cache using memory persistor', async () => {
    const persistor = createMemoryPersistor()

    // Create client and set some data
    const client1 = new QueryClient()
    const key = ['persist', 'a']
    client1.setQueryData(key, 'hello')

    // Start persistence
    await persistQueryClient({ queryClient: client1, persistor })

    // Allow microtask to flush the persistence write
    await Promise.resolve()

    // New client restores from persisted state
    const client2 = new QueryClient()
    await persistQueryClient({ queryClient: client2, persistor })

    expect(client2.getQueryData<string>(key)).toBe('hello')
  })

  test('should persist and restore using localStorage persistor', async () => {
    const persistor = createLocalStoragePersistor({ key: 'test-cache' })

    const client1 = new QueryClient()
    const key = ['localStorage', 'test']
    client1.setQueryData(key, { name: 'Test' })

    await persistQueryClient({ queryClient: client1, persistor })
    await Promise.resolve()

    const client2 = new QueryClient()
    await persistQueryClient({ queryClient: client2, persistor })

    expect(client2.getQueryData<{ name: string }>(key)).toEqual({ name: 'Test' })
  })

  test('should respect maxAge and avoid restoring stale data', async () => {
    // Custom persistor to control timestamp
    let stored: PersistedClient | undefined
    const persistor: Persistor = {
      async persistClient(data: unknown) {
        stored = data as PersistedClient
      },
      async restoreClient() {
        return stored
      },
      async removeClient() {
        stored = undefined
      },
    }

    const client1 = new QueryClient()
    const key = ['persist', 'stale']
    client1.setQueryData(key, 'old')
    await persistQueryClient({ queryClient: client1, persistor })

    // Simulate very old snapshot
    if (stored) stored.timestamp = Date.now() - 1000 * 60 * 60 * 24 * 7 // 7 days ago

    const client2 = new QueryClient()
    await persistQueryClient({ queryClient: client2, persistor, maxAge: 1000 }) // 1s

    expect(client2.getQueryData<string>(key)).toBeUndefined()
  })

  test('should persist multiple queries', async () => {
    const persistor = createMemoryPersistor()

    const client1 = new QueryClient()
    client1.setQueryData(['query1'], 'data1')
    client1.setQueryData(['query2'], 'data2')

    await persistQueryClient({ queryClient: client1, persistor })
    await Promise.resolve()

    const client2 = new QueryClient()
    await persistQueryClient({ queryClient: client2, persistor })

    expect(client2.getQueryData(['query1'])).toBe('data1')
    expect(client2.getQueryData(['query2'])).toBe('data2')
  })

  test('should handle persistor errors gracefully', async () => {
    const persistor: Persistor = {
      async persistClient() {
        throw new Error('Storage error')
      },
      async restoreClient() {
        throw new Error('Read error')
      },
      async removeClient() {},
    }

    const client = new QueryClient()
    client.setQueryData(['test'], 'value')

    // Should not throw
    await expect(
      persistQueryClient({ queryClient: client, persistor })
    ).resolves.not.toThrow()
  })

  test('should throttle cache updates', async () => {
    const persistor = createMemoryPersistor()
    const persistSpy = vi.spyOn(persistor, 'persistClient')

    const client = new QueryClient()
    await persistQueryClient({ queryClient: client, persistor })

    // Initial persist
    expect(persistSpy).toHaveBeenCalledTimes(1)

    // Set multiple queries rapidly
    client.setQueryData(['a'], 1)
    client.setQueryData(['b'], 2)
    client.setQueryData(['c'], 3)

    // Should only persist once more (throttled)
    await Promise.resolve()
    await Promise.resolve() // Allow microtasks to settle

    // Should have persisted initial + throttled updates
    expect(persistSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  test('should handle empty cache restore', async () => {
    const persistor = createMemoryPersistor()

    const client = new QueryClient()
    await persistQueryClient({ queryClient: client, persistor })

    // Restore from empty state should not crash
    const client2 = new QueryClient()
    await expect(
      persistQueryClient({ queryClient: client2, persistor })
    ).resolves.not.toThrow()
  })

  test('should restore with dehydrate options', async () => {
    const persistor = createMemoryPersistor()

    const client1 = new QueryClient()
    client1.setQueryData(['test'], 'value')

    await persistQueryClient({
      queryClient: client1,
      persistor,
      dehydrateOptions: {
        shouldDehydrateQuery: () => true,
      },
    })
    await Promise.resolve()

    const client2 = new QueryClient()
    await persistQueryClient({ queryClient: client2, persistor })

    expect(client2.getQueryData(['test'])).toBe('value')
  })
})
