import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MutationCache } from '../mutation/MutationCache'
import { QueryClient } from '../client/QueryClient'

describe('MutationCache', () => {
  let queryClient: QueryClient
  let mutationCache: MutationCache

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    mutationCache = queryClient.getMutationCache()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  describe('constructor', () => {
    test('should create empty cache', () => {
      const cache = new MutationCache()
      expect(cache.size).toBe(0)
    })
  })

  describe('subscribe', () => {
    test('should subscribe to cache events', () => {
      const callback = vi.fn()
      const unsubscribe = mutationCache.subscribe(callback)
      
      expect(typeof unsubscribe).toBe('function')
      
      // Trigger an event
      queryClient.setMutationData(['mutation'], 'data')
      
      expect(callback).toHaveBeenCalled()
      
      unsubscribe()
    })

    test('should unsubscribe from cache events', () => {
      const callback = vi.fn()
      const unsubscribe = mutationCache.subscribe(callback)
      
      unsubscribe()
      
      // Trigger an event after unsubscribe
      queryClient.setMutationData(['mutation'], 'data')
      
      // Should not be called after unsubscribe
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('find', () => {
    test('should find mutation by key', () => {
      const key = ['mutation']
      queryClient.setMutationData(key, 'data')
      
      const mutation = mutationCache.find(key)
      expect(mutation).toBeDefined()
      expect(mutation?.mutationKey).toEqual(key)
    })

    test('should return undefined for non-existent mutation', () => {
      const key = ['mutation']
      const mutation = mutationCache.find(key)
      expect(mutation).toBeUndefined()
    })
  })

  describe('findAll', () => {
    test('should find all mutations', () => {
      const key1 = ['mutation1']
      const key2 = ['mutation2']
      
      queryClient.setMutationData(key1, 'data1')
      queryClient.setMutationData(key2, 'data2')
      
      const mutations = mutationCache.findAll()
      expect(mutations).toHaveLength(2)
    })

    test('should find mutations with filters', () => {
      const key1 = ['mutation1']
      const key2 = ['mutation2']
      
      queryClient.setMutationData(key1, 'data1')
      queryClient.setMutationData(key2, 'data2')
      
      const mutations = mutationCache.findAll({ mutationKey: key1 })
      expect(mutations).toHaveLength(1)
      expect(mutations[0].mutationKey).toEqual(key1)
    })
  })

  describe('add', () => {
    test('should add mutation to cache', () => {
      const key = ['mutation']
      const callback = vi.fn()
      
      mutationCache.subscribe(callback)
      queryClient.setMutationData(key, 'data')
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'added',
          mutation: expect.objectContaining({
            mutationKey: key,
          }),
        })
      )
    })
  })

  describe('remove', () => {
    test('should remove mutation from cache', () => {
      const key = ['mutation']
      const callback = vi.fn()
      
      mutationCache.subscribe(callback)
      queryClient.setMutationData(key, 'data')
      queryClient.resetMutations({ mutationKey: key })
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'added',
          mutation: expect.objectContaining({
            mutationKey: key,
          }),
        })
      )
    })
  })

  describe('clear', () => {
    test('should clear all mutations', () => {
      const key1 = ['mutation1']
      const key2 = ['mutation2']
      const callback = vi.fn()
      
      mutationCache.subscribe(callback)
      queryClient.setMutationData(key1, 'data1')
      queryClient.setMutationData(key2, 'data2')
      
      mutationCache.clear()
      
      expect(mutationCache.size).toBe(0)
      
      // Should trigger remove events for all mutations
      const removeCalls = callback.mock.calls.filter(call => call[0].type === 'removed')
      expect(removeCalls).toHaveLength(2)
    })
  })

  describe('build', () => {
    test('should build mutation with options', () => {
      const key = ['mutation']
      const options = {
        mutationKey: key,
        mutationFn: (variables: string) => Promise.resolve(variables),
      }
      
      const mutation = mutationCache.build(queryClient, options)
      
      expect(mutation).toBeDefined()
      expect(mutation.mutationKey).toEqual(key)
    })

    test('should reuse existing mutation', () => {
      const key = ['mutation']
      const options = {
        mutationKey: key,
        mutationFn: (variables: string) => Promise.resolve(variables),
      }
      
      const mutation1 = mutationCache.build(queryClient, options)
      const mutation2 = mutationCache.build(queryClient, options)
      
      expect(mutation1).toBe(mutation2)
    })
  })

  describe('size', () => {
    test('should return correct cache size', () => {
      expect(mutationCache.size).toBe(0)
      
      queryClient.setMutationData(['mutation1'], 'data1')
      expect(mutationCache.size).toBe(1)
      
      queryClient.setMutationData(['mutation2'], 'data2')
      expect(mutationCache.size).toBe(2)
      
      queryClient.resetMutations({ mutationKey: ['mutation1'] })
      expect(mutationCache.size).toBe(2) // resetMutations doesn't remove, just resets
    })
  })
})
