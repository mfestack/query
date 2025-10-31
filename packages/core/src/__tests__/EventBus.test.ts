import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBus } from '../utils/EventBus'
import { Query } from '../query/Query'
import { Mutation } from '../mutation/Mutation'

describe('EventBus', () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  afterEach(() => {
    eventBus.dispose()
  })

  describe('basic event subscription and emission', () => {
    test('should subscribe and emit events', async () => {
      const listener = vi.fn()
      eventBus.on('query:added', listener)

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })

      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith({ query })
    })

    test('should support multiple listeners', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      eventBus.on('query:updated', listener1)
      eventBus.on('query:updated', listener2)

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    test('should unsubscribe listener', async () => {
      const listener = vi.fn()
      const unsubscribe = eventBus.on('query:added', listener)

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })
      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      eventBus.emit('query:added', { query })
      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    test('should use off method to unsubscribe', async () => {
      const listener = vi.fn()
      eventBus.on('query:added', listener)

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })
      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(1)

      eventBus.off('query:added', listener)
      eventBus.emit('query:added', { query })
      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(1) // Still 1
    })
  })

  describe('replay buffer', () => {
    test('should buffer events when replay is enabled', async () => {
      const query1 = { queryKey: ['test1'] } as unknown as Query
      const query2 = { queryKey: ['test2'] } as unknown as Query

      // Emit events before listener subscribes
      eventBus.emit('query:added', { query: query1 })
      eventBus.emit('query:added', { query: query2 })
      await Promise.resolve() // Allow events to be processed

      // Now subscribe with replay enabled
      const listener = vi.fn()
      eventBus.on('query:added', listener, { replay: true })

      await Promise.resolve() // Allow replay to complete

      // Listener should receive both buffered events
      expect(listener).toHaveBeenCalledTimes(2)
      expect(listener).toHaveBeenNthCalledWith(1, { query: query1 })
      expect(listener).toHaveBeenNthCalledWith(2, { query: query2 })
    })

    test('should not replay when replay is disabled', () => {
      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })

      const listener = vi.fn()
      eventBus.on('query:added', listener, { replay: false })

      expect(listener).not.toHaveBeenCalled()
    })

    test('should respect max buffer size', () => {
      eventBus.enableReplay('query:updated', { maxSize: 3, enabled: true })

      // Emit 5 events
      for (let i = 0; i < 5; i++) {
        const query = { queryKey: [`test${i}`] } as unknown as Query
        eventBus.emit('query:updated', { query })
      }

      const buffer = eventBus.getReplayBuffer('query:updated')
      expect(buffer.length).toBe(3) // Should only keep last 3
      expect(buffer[0].payload.query.queryKey).toEqual(['test2'])
      expect(buffer[1].payload.query.queryKey).toEqual(['test3'])
      expect(buffer[2].payload.query.queryKey).toEqual(['test4'])
    })

    test('should clear replay buffer for specific event', () => {
      eventBus.enableReplay('query:added', { maxSize: 10, enabled: true })
      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })

      expect(eventBus.getReplayBuffer('query:added').length).toBe(1)

      eventBus.clearReplayBuffer('query:added')
      expect(eventBus.getReplayBuffer('query:added').length).toBe(0)
    })

    test('should disable replay for specific event', () => {
      eventBus.enableReplay('query:added', { maxSize: 10, enabled: true })
      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })

      eventBus.disableReplay('query:added')

      const listener = vi.fn()
      eventBus.on('query:added', listener, { replay: true })
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('event priorities', () => {
    test('should dispatch high priority events immediately', () => {
      const listener = vi.fn()
      eventBus.on('cache:cleared', listener)

      eventBus.emit('cache:cleared', {}, 'high')

      // High priority should be called synchronously
      expect(listener).toHaveBeenCalledTimes(1)
    })

    test('should dispatch normal priority events in microtask', async () => {
      const listener = vi.fn()
      eventBus.on('query:updated', listener)

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:updated', { query }, 'normal')

      // Should not be called immediately
      expect(listener).not.toHaveBeenCalled()

      // Wait for microtask
      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(1)
    })

    test('should dispatch low priority events in idle callback or setTimeout', async () => {
      const listener = vi.fn()
      eventBus.on('devtools:inspect', listener)

      eventBus.emit('devtools:inspect', {}, 'low')

      // Should not be called immediately
      expect(listener).not.toHaveBeenCalled()

      // Wait a bit for setTimeout
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(listener).toHaveBeenCalledTimes(1)
    })

    test('should use default priority when not specified', async () => {
      const listener = vi.fn()
      eventBus.on('query:updated', listener)

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:updated', { query })

      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('event types', () => {
    test('should handle query lifecycle events', async () => {
      const listener = vi.fn()
      eventBus.on('query:added', listener)
      eventBus.on('query:updated', listener)
      eventBus.on('query:removed', listener)

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })
      eventBus.emit('query:updated', { query })
      eventBus.emit('query:removed', { query })

      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(3)
    })

    test('should handle mutation lifecycle events', async () => {
      const listener = vi.fn()
      eventBus.on('mutation:started', listener)
      eventBus.on('mutation:success', listener)
      eventBus.on('mutation:error', listener)

      const mutation = { mutationKey: 'test' } as unknown as Mutation
      eventBus.emit('mutation:started', { mutation })
      eventBus.emit('mutation:success', { mutation, data: 'result' })
      eventBus.emit('mutation:error', { mutation, error: new Error('test') })

      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(3)
    })

    test('should handle cache events', async () => {
      const listener = vi.fn()
      eventBus.on('cache:invalidated', listener)
      eventBus.on('cache:cleared', listener)

      eventBus.emit('cache:invalidated', { queryKeys: [['test']] })
      eventBus.emit('cache:cleared', {})

      await Promise.resolve()
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    test('should catch errors in listeners and continue', async () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error')
      })
      const normalListener = vi.fn()

      eventBus.on('query:added', errorListener)
      eventBus.on('query:added', normalListener)

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })

      await Promise.resolve()

      // Both listeners should be called
      expect(errorListener).toHaveBeenCalledTimes(1)
      expect(normalListener).toHaveBeenCalledTimes(1)
    })
  })

  describe('listener count', () => {
    test('should return correct listener count', () => {
      expect(eventBus.getListenerCount('query:added')).toBe(0)

      const unsubscribe1 = eventBus.on('query:added', vi.fn())
      expect(eventBus.getListenerCount('query:added')).toBe(1)

      eventBus.on('query:added', vi.fn())
      expect(eventBus.getListenerCount('query:added')).toBe(2)

      unsubscribe1()
      expect(eventBus.getListenerCount('query:added')).toBe(1)
    })
  })

  describe('dispose', () => {
    test('should clear all listeners and buffers on dispose', () => {
      const listener = vi.fn()
      eventBus.on('query:added', listener)
      eventBus.enableReplay('query:added', { maxSize: 10, enabled: true })

      const query = { queryKey: ['test'] } as unknown as Query
      eventBus.emit('query:added', { query })

      expect(eventBus.getListenerCount('query:added')).toBe(1)
      expect(eventBus.getReplayBuffer('query:added').length).toBe(1)

      eventBus.dispose()

      expect(eventBus.getListenerCount('query:added')).toBe(0)
      expect(eventBus.getReplayBuffer('query:added').length).toBe(0)
    })
  })

  describe('configuration', () => {
    test('should create EventBus with custom options', () => {
      const customBus = new EventBus({
        enableReplay: false,
        defaultPriority: 'high',
        replayBufferSize: 100,
      })

      expect(customBus.getReplayBuffer('query:added').length).toBe(0)
      customBus.dispose()
    })

    test('should enable replay for default events', () => {
      const busWithReplay = new EventBus({ enableReplay: true })

      const query = { queryKey: ['test'] } as unknown as Query
      busWithReplay.emit('query:added', { query })

      const buffer = busWithReplay.getReplayBuffer('query:added')
      expect(buffer.length).toBe(1)

      busWithReplay.dispose()
    })
  })
})

