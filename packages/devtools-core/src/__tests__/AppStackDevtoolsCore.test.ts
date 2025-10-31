import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient } from '@mfestack/core'
import { AppStackDevtoolsCore } from '../index.js'

describe('AppStackDevtoolsCore', () => {
  let queryClient: QueryClient
  let devtools: AppStackDevtoolsCore

  beforeEach(() => {
    queryClient = new QueryClient()
    devtools = new AppStackDevtoolsCore(queryClient)
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('initialization', () => {
    test('should initialize with empty state', () => {
      const state = devtools.getState()
      expect(state.queries).toEqual([])
      expect(state.mutations).toEqual([])
      expect(state.events).toEqual([])
    })

    test('should subscribe to EventBus events', async () => {
      const state1 = devtools.getState()
      expect(state1.queries).toEqual([])

      await queryClient.fetchQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data'),
      })

      await Promise.resolve()
      const state2 = devtools.getState()
      expect(state2.queries.length).toBeGreaterThan(0)
    })
  })

  describe('state subscription', () => {
    test('should notify listeners on state changes', async () => {
      const listener = vi.fn()
      const unsubscribe = devtools.subscribe(listener)

      // Should be called immediately with initial state
      expect(listener).toHaveBeenCalledTimes(1)

      await queryClient.fetchQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data'),
      })

      await Promise.resolve()

      // Should be called again after query update(s)
      // Note: called multiple times due to query:added, query:updated events during fetch lifecycle
      // We check that it's called at least once more (beyond initial), focusing on final state
      // Check it was called at least once more (beyond initial call)
      expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2)
      // Get the last state update (checking final state is more important than exact call count)
      const lastState = listener.mock.calls[listener.mock.calls.length - 1][0]
      expect(lastState.queries.length).toBeGreaterThan(0)

      unsubscribe()
    })

    test('should unsubscribe listener', async () => {
      const listener = vi.fn()
      const unsubscribe = devtools.subscribe(listener)

      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      await queryClient.fetchQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data'),
      })

      await Promise.resolve()

      // Should not be called again after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('query actions', () => {
    test('should refetch query', async () => {
      await queryClient.fetchQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data1'),
      })

      const state1 = devtools.getState()
      expect(state1.queries.length).toBe(1)

      devtools.refetchQuery(['test'])

      await Promise.resolve()
      // Query should still exist
      const state2 = devtools.getState()
      expect(state2.queries.length).toBe(1)
    })

    test('should invalidate query', async () => {
      await queryClient.fetchQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data'),
      })

      const state1 = devtools.getState()
      const query = state1.queries[0]
      expect(query).toBeDefined()

      await devtools.invalidateQuery(['test'])

      await Promise.resolve()
      const state2 = devtools.getState()
      // Query should still exist but may be invalidated
      expect(state2.queries.length).toBe(1)
    })

    test('should remove query', async () => {
      await queryClient.fetchQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data'),
      })

      const state1 = devtools.getState()
      expect(state1.queries.length).toBe(1)

      devtools.removeQuery(['test'])

      await Promise.resolve()
      const state2 = devtools.getState()
      expect(state2.queries.length).toBe(0)
    })
  })

  describe('cache actions', () => {
    test('should clear cache', async () => {
      await queryClient.fetchQuery({
        queryKey: ['test1'],
        queryFn: () => Promise.resolve('data1'),
      })
      await queryClient.fetchQuery({
        queryKey: ['test2'],
        queryFn: () => Promise.resolve('data2'),
      })

      const state1 = devtools.getState()
      expect(state1.queries.length).toBe(2)

      devtools.clearCache()

      await Promise.resolve()
      const state2 = devtools.getState()
      expect(state2.queries.length).toBe(0)
    })
  })

  describe('query tracking', () => {
    test('should track query lifecycle events', async () => {
      const listener = vi.fn()
      devtools.subscribe(listener)

      await queryClient.fetchQuery({
        queryKey: ['users'],
        queryFn: () => Promise.resolve([{ id: 1, name: 'John' }]),
      })

      await Promise.resolve()

      const state = devtools.getState()
      const query = state.queries.find(q => q.queryKey[0] === 'users')
      expect(query).toBeDefined()
      expect(query?.queryKey).toEqual(['users'])
      expect(query?.status).toBe('success')
    })

    test('should track query errors', async () => {
      try {
        await queryClient.fetchQuery({
          queryKey: ['error'],
          queryFn: () => Promise.reject(new Error('Fetch failed')),
          retry: false, // Disable retries for faster test
        })
      } catch {
        // Expected to throw
      }

      await Promise.resolve()
      await new Promise(resolve => setTimeout(resolve, 50)) // Allow async updates to complete

      const state = devtools.getState()
      const query = state.queries.find(q => q.queryKey[0] === 'error')
      expect(query).toBeDefined()
      expect(query?.status).toBe('error')
      expect(query?.error).toBeInstanceOf(Error)
    }, 10000) // Increase timeout

    test('should track multiple queries', async () => {
      await Promise.all([
        queryClient.fetchQuery({
          queryKey: ['users'],
          queryFn: () => Promise.resolve([]),
        }),
        queryClient.fetchQuery({
          queryKey: ['posts'],
          queryFn: () => Promise.resolve([]),
        }),
      ])

      await Promise.resolve()

      const state = devtools.getState()
      expect(state.queries.length).toBe(2)
      expect(state.queries.some(q => q.queryKey[0] === 'users')).toBe(true)
      expect(state.queries.some(q => q.queryKey[0] === 'posts')).toBe(true)
    })
  })

  describe('event timeline', () => {
    test('should track query:updated events', async () => {
      const listener = vi.fn()
      devtools.subscribe(listener)

      await queryClient.fetchQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('data'),
      })

      await Promise.resolve()

      const state = devtools.getState()
      // Events array should contain query:updated events
      expect(state.events.length).toBeGreaterThan(0)
      expect(state.events.some(e => e.type === 'query:updated')).toBe(true)
    })

    test('should limit events buffer to 50', async () => {
      // Emit more than 50 query updates
      for (let i = 0; i < 60; i++) {
        await queryClient.fetchQuery({
          queryKey: ['test', i],
          queryFn: () => Promise.resolve(`data${i}`),
        })
        await Promise.resolve()
      }

      const state = devtools.getState()
      expect(state.events.length).toBeLessThanOrEqual(50)
    })
  })

  describe('client switching', () => {
    test('should switch to new QueryClient', async () => {
      await queryClient.fetchQuery({
        queryKey: ['old'],
        queryFn: () => Promise.resolve('old-data'),
      })

      const state1 = devtools.getState()
      expect(state1.queries.length).toBe(1)

      const newClient = new QueryClient()
      devtools.setClient(newClient)

      const state2 = devtools.getState()
      expect(state2.queries.length).toBe(0)

      await newClient.fetchQuery({
        queryKey: ['new'],
        queryFn: () => Promise.resolve('new-data'),
      })

      await Promise.resolve()
      const state3 = devtools.getState()
      expect(state3.queries.length).toBe(1)
      expect(state3.queries[0].queryKey[0]).toBe('new')
    })

    test('should unsubscribe from old client EventBus', async () => {
      const listener = vi.fn()
      devtools.subscribe(listener)

      await queryClient.fetchQuery({
        queryKey: ['old'],
        queryFn: () => Promise.resolve('old-data'),
      })

      await Promise.resolve()

      const newClient = new QueryClient()
      devtools.setClient(newClient)

      // Old client events should not trigger updates
      await queryClient.fetchQuery({
        queryKey: ['old2'],
        queryFn: () => Promise.resolve('old-data2'),
      })

      await Promise.resolve()

      // Last call should be from setClient, not from old client events
      const state = listener.mock.calls[listener.mock.calls.length - 1][0]
      expect(state.queries.some(q => q.queryKey[0] === 'old2')).toBe(false)
    })
  })
})

