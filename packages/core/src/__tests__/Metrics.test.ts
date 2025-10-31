import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBus } from '../utils/EventBus'
import { Metrics } from '../metrics/Metrics'
import { Query } from '../query/Query'

describe('Metrics', () => {
  let eventBus: EventBus
  let metrics: Metrics

  beforeEach(() => {
    eventBus = new EventBus()
    metrics = new Metrics(eventBus)
  })

  afterEach(() => {
    metrics.dispose()
    eventBus.dispose()
  })

  describe('initialization', () => {
    test('should initialize with zero counters', () => {
      const snapshot = metrics.getSnapshot()
      expect(snapshot.queriesFetched).toBe(0)
      expect(snapshot.queriesSucceeded).toBe(0)
      expect(snapshot.queriesFailed).toBe(0)
      expect(snapshot.cacheInvalidations).toBe(0)
      expect(snapshot.cacheClears).toBe(0)
      expect(snapshot.mutationsStarted).toBe(0)
      expect(snapshot.mutationsSucceeded).toBe(0)
      expect(snapshot.mutationsFailed).toBe(0)
      expect(snapshot.lastUpdatedAt).toBeGreaterThan(0)
    })

    test('should initialize without EventBus', () => {
      const metricsWithoutBus = new Metrics()
      const snapshot = metricsWithoutBus.getSnapshot()
      expect(snapshot.queriesFetched).toBe(0)
      metricsWithoutBus.dispose()
    })

    test('should attach to EventBus later', async () => {
      const metricsWithoutBus = new Metrics()
      const snapshot1 = metricsWithoutBus.getSnapshot()
      expect(snapshot1.queriesFetched).toBe(0)

      metricsWithoutBus.attach(eventBus)
      
      const query = { queryKey: ['test'], state: { status: 'success' } } as any
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      const snapshot2 = metricsWithoutBus.getSnapshot()
      expect(snapshot2.queriesFetched).toBe(1)
      
      metricsWithoutBus.dispose()
    })
  })

  describe('query metrics', () => {
    test('should track queriesFetched', async () => {
      const query = { queryKey: ['test'], state: { status: 'loading' } } as any
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.queriesFetched).toBe(1)
    })

    test('should track queriesSucceeded', async () => {
      const query = { queryKey: ['test'], state: { status: 'success' } } as any
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.queriesFetched).toBe(1)
      expect(snapshot.queriesSucceeded).toBe(1)
      expect(snapshot.queriesFailed).toBe(0)
    })

    test('should track queriesFailed', async () => {
      const query = { queryKey: ['test'], state: { status: 'error' } } as any
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.queriesFetched).toBe(1)
      expect(snapshot.queriesSucceeded).toBe(0)
      expect(snapshot.queriesFailed).toBe(1)
    })

    test('should track multiple query updates', async () => {
      const query1 = { queryKey: ['test1'], state: { status: 'success' } } as any
      const query2 = { queryKey: ['test2'], state: { status: 'error' } } as any
      const query3 = { queryKey: ['test3'], state: { status: 'success' } } as any

      eventBus.emit('query:updated', { query: query1 })
      eventBus.emit('query:updated', { query: query2 })
      eventBus.emit('query:updated', { query: query3 })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.queriesFetched).toBe(3)
      expect(snapshot.queriesSucceeded).toBe(2)
      expect(snapshot.queriesFailed).toBe(1)
    })

    test('should handle query without state', async () => {
      const query = { queryKey: ['test'] } as any
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.queriesFetched).toBe(1)
      expect(snapshot.queriesSucceeded).toBe(0)
      expect(snapshot.queriesFailed).toBe(0)
    })
  })

  describe('mutation metrics', () => {
    test('should track mutationsStarted', async () => {
      const mutation = { mutationKey: ['test'] } as any
      eventBus.emit('mutation:started', { mutation })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.mutationsStarted).toBe(1)
      expect(snapshot.mutationsSucceeded).toBe(0)
      expect(snapshot.mutationsFailed).toBe(0)
    })

    test('should track mutationsSucceeded', async () => {
      const mutation = { mutationKey: ['test'] } as any
      eventBus.emit('mutation:success', { mutation, data: 'result' })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.mutationsStarted).toBe(0)
      expect(snapshot.mutationsSucceeded).toBe(1)
      expect(snapshot.mutationsFailed).toBe(0)
    })

    test('should track mutationsFailed', async () => {
      const mutation = { mutationKey: ['test'] } as any
      eventBus.emit('mutation:error', { mutation, error: new Error('test') })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.mutationsStarted).toBe(0)
      expect(snapshot.mutationsSucceeded).toBe(0)
      expect(snapshot.mutationsFailed).toBe(1)
    })

    test('should track complete mutation lifecycle', async () => {
      const mutation = { mutationKey: ['test'] } as any

      eventBus.emit('mutation:started', { mutation })
      await Promise.resolve()
      
      eventBus.emit('mutation:success', { mutation, data: 'result' })
      await Promise.resolve()

      const snapshot = metrics.getSnapshot()
      expect(snapshot.mutationsStarted).toBe(1)
      expect(snapshot.mutationsSucceeded).toBe(1)
      expect(snapshot.mutationsFailed).toBe(0)
    })
  })

  describe('cache metrics', () => {
    test('should track cacheInvalidations', async () => {
      eventBus.emit('cache:invalidated', { queryKeys: [['test']] })

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.cacheInvalidations).toBe(1)
    })

    test('should track cacheClears', async () => {
      eventBus.emit('cache:cleared', {})

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.cacheClears).toBe(1)
    })

    test('should track multiple cache operations', async () => {
      eventBus.emit('cache:invalidated', { queryKeys: [['test1']] })
      eventBus.emit('cache:invalidated', { queryKeys: [['test2']] })
      eventBus.emit('cache:cleared', {})

      await Promise.resolve()
      const snapshot = metrics.getSnapshot()
      expect(snapshot.cacheInvalidations).toBe(2)
      expect(snapshot.cacheClears).toBe(1)
    })
  })

  describe('snapshot subscription', () => {
    test('should notify listeners on updates', async () => {
      const listener = vi.fn()
      metrics.subscribe(listener)

      // Should be called immediately with initial snapshot
      expect(listener).toHaveBeenCalledTimes(1)

      const query = { queryKey: ['test'], state: { status: 'success' } } as any
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      
      // Should be called again after update(s)
      // Note: called multiple times due to queriesFetched + queriesSucceeded increments (each triggers emit)
      expect(listener).toHaveBeenCalledTimes(3) // 1 initial + 2 increments
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0]
      expect(lastCall.queriesFetched).toBe(1)
      expect(lastCall.queriesSucceeded).toBe(1)
    })

    test('should unsubscribe listener', async () => {
      const listener = vi.fn()
      const unsubscribe = metrics.subscribe(listener)

      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      const query = { queryKey: ['test'], state: { status: 'success' } } as any
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      
      // Should not be called again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1)
    })

    test('should provide immutable snapshots', () => {
      const listener = vi.fn()
      metrics.subscribe(listener)

      const snapshot1 = listener.mock.calls[0][0]
      const snapshot2 = metrics.getSnapshot()

      // Snapshots should be different objects
      expect(snapshot1).not.toBe(snapshot2)
      // But should have same values
      expect(snapshot1.queriesFetched).toBe(snapshot2.queriesFetched)
    })

    test('should update lastUpdatedAt on each increment', async () => {
      const listener = vi.fn()
      metrics.subscribe(listener)

      const firstCall = listener.mock.calls[0][0]
      const firstTimestamp = firstCall.lastUpdatedAt

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10))

      const query = { queryKey: ['test'], state: { status: 'success' } } as any
      eventBus.emit('query:updated', { query })

      await Promise.resolve()

      const secondCall = listener.mock.calls[1][0]
      const secondTimestamp = secondCall.lastUpdatedAt

      expect(secondTimestamp).toBeGreaterThan(firstTimestamp)
    })
  })

  describe('detach and dispose', () => {
    test('should detach from EventBus', async () => {
      const query = { queryKey: ['test'], state: { status: 'success' } } as any
      eventBus.emit('query:updated', { query })
      await Promise.resolve()

      const snapshot1 = metrics.getSnapshot()
      expect(snapshot1.queriesFetched).toBe(1)

      metrics.detach()

      eventBus.emit('query:updated', { query })
      await Promise.resolve()

      const snapshot2 = metrics.getSnapshot()
      expect(snapshot2.queriesFetched).toBe(1) // Still 1, not incremented
    })

    test('should clear listeners on dispose', () => {
      const listener = vi.fn()
      metrics.subscribe(listener)

      expect(listener).toHaveBeenCalledTimes(1)

      metrics.dispose()

      // Should not be able to subscribe after dispose (though we don't prevent it)
      // But listeners should be cleared
      const snapshot = metrics.getSnapshot()
      expect(snapshot).toBeDefined()
    })

    test('should detach and clear listeners on dispose', async () => {
      const query = { queryKey: ['test'], state: { status: 'success' } } as any
      
      const listener = vi.fn()
      metrics.subscribe(listener)

      metrics.dispose()

      eventBus.emit('query:updated', { query })
      await Promise.resolve()

      // Listener should not be called again
      expect(listener).toHaveBeenCalledTimes(1)

      const snapshot = metrics.getSnapshot()
      expect(snapshot.queriesFetched).toBe(0) // Not incremented after detach
    })
  })
})

