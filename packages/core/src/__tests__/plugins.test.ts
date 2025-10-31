import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { QueryClient } from '../client/QueryClient'
import { createQueryClient } from '../client/createQueryClient'
import { persistPlugin, broadcastPlugin, loggerPlugin, devtoolsPlugin } from '../plugins'
import { queryKey } from './utils'

describe('Plugins', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  describe('persistPlugin', () => {
    test('should create persist plugin', () => {
      const plugin = persistPlugin()
      
      expect(plugin).toBeDefined()
      expect(plugin.id).toBe('persist')
      expect(typeof plugin.onRestore).toBe('function')
      expect(typeof plugin.onPersist).toBe('function')
    })

    test('should persist data to localStorage', () => {
      const mockStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
      })
      
      const plugin = persistPlugin({ storage: mockStorage as any })
      queryClient.use(plugin)
      
      const key = queryKey()
      queryClient.setQueryData(key, 'test data')
      
      // Trigger persist
      queryClient.dehydrate()
      
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    test('should restore data from localStorage', () => {
      const mockStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify({
          state: { queries: [], mutations: [] },
          timestamp: Date.now(),
        })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
      })
      
      const plugin = persistPlugin({ storage: mockStorage as any })
      queryClient.use(plugin)
      
      // Should restore on init
      expect(mockStorage.getItem).toHaveBeenCalled()
    })
  })

  describe('broadcastPlugin', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('should create broadcast plugin', () => {
      const plugin = broadcastPlugin()
      
      expect(plugin).toBeDefined()
      expect(plugin.id).toBe('broadcast')
      expect(typeof plugin.onInit).toBe('function')
      expect(typeof plugin.onCacheUpdate).toBe('function')
      expect(typeof plugin.dispose).toBe('function')
    })

    test('should create broadcast channel with default name', () => {
      const mockBroadcastChannel = vi.fn().mockImplementation(() => ({
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null,
      }))
      
      Object.defineProperty(window, 'BroadcastChannel', {
        value: mockBroadcastChannel,
        writable: true,
      })
      
      const plugin = broadcastPlugin()
      queryClient.use(plugin)
      
      expect(mockBroadcastChannel).toHaveBeenCalledWith('mfestack-query-sync')
    })

    test('should create scoped broadcast channel', () => {
      const mockBroadcastChannel = vi.fn().mockImplementation(() => ({
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null,
      }))
      
      Object.defineProperty(window, 'BroadcastChannel', {
        value: mockBroadcastChannel,
        writable: true,
      })
      
      const plugin = broadcastPlugin({ scope: 'app-a' })
      queryClient.use(plugin)
      
      expect(mockBroadcastChannel).toHaveBeenCalledWith('mfestack-query-sync-app-a')
    })

    test('should broadcast cache updates with throttling', () => {
      const mockChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null,
      }
      
      const mockBroadcastChannel = vi.fn().mockReturnValue(mockChannel)
      
      Object.defineProperty(window, 'BroadcastChannel', {
        value: mockBroadcastChannel,
        writable: true,
      })
      
      const plugin = broadcastPlugin({ throttleMs: 100 })
      queryClient.use(plugin)
      
      // Trigger cache update
      const key = queryKey()
      queryClient.setQueryData(key, 'data')
      
      // Should not broadcast immediately (throttled)
      expect(mockChannel.postMessage).not.toHaveBeenCalled()
      
      // Advance time past throttle delay
      vi.advanceTimersByTime(100)
      
      // Should have broadcasted once with full state
      expect(mockChannel.postMessage).toHaveBeenCalledTimes(1)
      const message = JSON.parse(mockChannel.postMessage.mock.calls[0][0])
      expect(message.type).toBe('cache-update')
      expect(message.state).toBeDefined()
      expect(message.origin).toBeDefined()
      expect(message.timestamp).toBeDefined()
    })

    test('should throttle rapid cache updates', () => {
      const mockChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null,
      }
      
      const mockBroadcastChannel = vi.fn().mockReturnValue(mockChannel)
      
      Object.defineProperty(window, 'BroadcastChannel', {
        value: mockBroadcastChannel,
        writable: true,
      })
      
      const plugin = broadcastPlugin({ throttleMs: 1000 })
      queryClient.use(plugin)
      
      // Rapid cache updates
      queryClient.setQueryData(['a'], 1)
      queryClient.setQueryData(['b'], 2)
      queryClient.setQueryData(['c'], 3)
      
      // Should not broadcast immediately
      expect(mockChannel.postMessage).not.toHaveBeenCalled()
      
      // Advance time past throttle
      vi.advanceTimersByTime(1000)
      
      // Should only broadcast once (last state)
      expect(mockChannel.postMessage).toHaveBeenCalledTimes(1)
    })

    test('should ignore messages from same origin', () => {
      const mockChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      }
      
      const mockBroadcastChannel = vi.fn().mockReturnValue(mockChannel)
      
      Object.defineProperty(window, 'BroadcastChannel', {
        value: mockBroadcastChannel,
        writable: true,
      })
      
      const plugin = broadcastPlugin()
      queryClient.use(plugin)
      
      // Get the origin ID from the first broadcast
      queryClient.setQueryData(['test'], 'value')
      vi.advanceTimersByTime(1000)
      
      expect(mockChannel.postMessage).toHaveBeenCalled()
      const firstMessage = JSON.parse(mockChannel.postMessage.mock.calls[0][0])
      const originId = firstMessage.origin
      
      // Simulate receiving our own message
      if (mockChannel.onmessage) {
        mockChannel.onmessage({
          data: JSON.stringify({
            type: 'cache-update',
            state: { queries: [], mutations: [] },
            timestamp: Date.now(),
            origin: originId,
          }),
        } as MessageEvent)
      }
      
      // Should not have triggered hydrate (same origin)
      const data = queryClient.getQueryData(['test'])
      expect(data).toBe('value') // Still original value, not replaced
    })

    test('should filter messages by scope', () => {
      const mockChannelA = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      }
      
      const mockChannelB = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      }
      
      let channelCount = 0
      const mockBroadcastChannel = vi.fn().mockImplementation(() => {
        channelCount++
        return channelCount === 1 ? mockChannelA : mockChannelB
      })
      
      Object.defineProperty(window, 'BroadcastChannel', {
        value: mockBroadcastChannel,
        writable: true,
      })
      
      // Client A with scope 'app-a'
      const pluginA = broadcastPlugin({ scope: 'app-a' })
      queryClient.use(pluginA)
      
      // Simulate message from different scope
      if (mockChannelA.onmessage) {
        mockChannelA.onmessage({
          data: JSON.stringify({
            type: 'cache-update',
            state: { queries: [{ queryKey: ['test'], state: { data: 'from-b' } }], mutations: [] },
            timestamp: Date.now(),
            origin: 'other-tab',
            scope: 'app-b', // Different scope
          }),
        } as MessageEvent)
      }
      
      // Should not process message from different scope
      expect(queryClient.getQueryData(['test'])).toBeUndefined()
    })

    test('should handle dispose cleanup', () => {
      const mockChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null,
      }
      
      const mockBroadcastChannel = vi.fn().mockReturnValue(mockChannel)
      
      Object.defineProperty(window, 'BroadcastChannel', {
        value: mockBroadcastChannel,
        writable: true,
      })
      
      const plugin = broadcastPlugin({ throttleMs: 100 })
      queryClient.use(plugin)
      
      queryClient.setQueryData(['test'], 'value')
      
      // Dispose before throttle expires
      plugin.dispose?.()
      
      // Should close channel and clear pending state
      expect(mockChannel.close).toHaveBeenCalled()
    })
  })

  describe('createSyncCoordinator', () => {
    test('should start and perform initial sync (persist then broadcast)', async () => {
      vi.useFakeTimers()

      const mockChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      }

      const mockBroadcastChannel = vi.fn().mockReturnValue(mockChannel)
      Object.defineProperty(window, 'BroadcastChannel', {
        value: mockBroadcastChannel,
        writable: true,
      })

      // Memory persistor with spies
      let stored: any
      const persistor = {
        persistClient: vi.fn(async (data: any) => { stored = data }),
        restoreClient: vi.fn(async () => stored),
        removeClient: vi.fn(async () => { stored = undefined }),
      }

      queryClient.setQueryData(['x'], 1)

      const { createSyncCoordinator } = await import('../plugins')
      const coord = createSyncCoordinator({
        queryClient,
        persistor: persistor as any,
        broadcast: { throttleMs: 100 },
      })

      await coord.start()

      // Initial run schedules immediate persist+broadcast
      // Advance timers to allow throttled broadcast
      vi.advanceTimersByTime(100)

      expect(persistor.persistClient).toHaveBeenCalled()
      expect(mockChannel.postMessage).toHaveBeenCalled()

      await coord.stop()
      vi.useRealTimers()
    })
  })

  describe('loggerPlugin', () => {
    test('should create logger plugin', () => {
      const mockLogger = {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }
      
      const plugin = loggerPlugin({ logger: mockLogger })
      
      expect(plugin).toBeDefined()
      expect(plugin.id).toBe('logger')
      expect(typeof plugin.onInit).toBe('function')
    })

    test('should log events', () => {
      const mockLogger = {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }
      
      const plugin = loggerPlugin({ logger: mockLogger })
      queryClient.use(plugin)
      
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[AppStack Query] AppStack Query Client initialized',
        queryClient
      )
      
      // Test query events
      const key = queryKey()
      queryClient.setQueryData(key, 'data')
      
      expect(mockLogger.log).toHaveBeenCalledWith('[AppStack Query] Query added', { queryKey: key, queryHash: expect.any(String) })
    })
  })

  describe('devtoolsPlugin', () => {
    test('should create devtools plugin', () => {
      const plugin = devtoolsPlugin()
      
      expect(plugin).toBeDefined()
      expect(plugin.id).toBe('devtools')
      expect(typeof plugin.onInit).toBe('function')
      expect(typeof plugin.dispose).toBe('function')
    })

    test('should expose client to window in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      // Clear any existing client
      delete (window as any).__APPSTACK_QUERY_CLIENT__
      delete (window as any).__APPSTACK_QUERY_DEVTOOLS__
      
      const plugin = devtoolsPlugin()
      const testClient = createQueryClient()
      testClient.use(plugin)
      
      expect((window as any).__APPSTACK_QUERY_CLIENT__).toBe(testClient)
      expect((window as any).__APPSTACK_QUERY_DEVTOOLS__).toBeDefined()
      
      process.env.NODE_ENV = originalEnv
    })

    test('should not expose client in production', () => {
      // Clear any existing client
      delete (window as any).__APPSTACK_QUERY_CLIENT__
      delete (window as any).__APPSTACK_QUERY_DEVTOOLS__
      
      const plugin = devtoolsPlugin({ enabled: false })
      const testClient = createQueryClient()
      testClient.use(plugin)
      
      expect((window as any).__APPSTACK_QUERY_CLIENT__).toBeUndefined()
      expect((window as any).__APPSTACK_QUERY_DEVTOOLS__).toBeUndefined()
    })

    test('should clean up on dispose', () => {
      // Clear any existing client
      delete (window as any).__APPSTACK_QUERY_CLIENT__
      delete (window as any).__APPSTACK_QUERY_DEVTOOLS__
      
      const plugin = devtoolsPlugin({ enabled: true })
      const testClient = createQueryClient()
      testClient.use(plugin)
      
      // Should be exposed
      expect((window as any).__APPSTACK_QUERY_CLIENT__).toBe(testClient)
      expect((window as any).__APPSTACK_QUERY_DEVTOOLS__).toBeDefined()
      
      // Dispose
      plugin.dispose?.()
      
      // Should be cleaned up
      expect((window as any).__APPSTACK_QUERY_CLIENT__).toBeUndefined()
      expect((window as any).__APPSTACK_QUERY_DEVTOOLS__).toBeUndefined()
    })
  })

  describe('plugin lifecycle', () => {
    test('should register and unregister plugins', () => {
      const mockPlugin = {
        id: 'test-plugin',
        onInit: vi.fn(),
        dispose: vi.fn(),
      }
      
      queryClient.use(mockPlugin)
      expect(mockPlugin.onInit).toHaveBeenCalledWith(queryClient)
      
      queryClient.removePlugin('test-plugin')
      expect(mockPlugin.dispose).toHaveBeenCalled()
    })

    test('should handle multiple plugins', () => {
      const plugin1 = {
        id: 'plugin1',
        onInit: vi.fn(),
      }
      
      const plugin2 = {
        id: 'plugin2',
        onInit: vi.fn(),
      }
      
      queryClient.use(plugin1)
      queryClient.use(plugin2)
      
      expect(plugin1.onInit).toHaveBeenCalledWith(queryClient)
      expect(plugin2.onInit).toHaveBeenCalledWith(queryClient)
    })
  })
})
