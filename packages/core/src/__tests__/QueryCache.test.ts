import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { QueryCache } from '../query/QueryCache'
import { QueryClient } from '../client/QueryClient'
import { queryKey } from './utils'

describe('QueryCache', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  describe('constructor', () => {
    test('should create empty cache', () => {
      const cache = new QueryCache()
      expect(cache.size).toBe(0)
    })
  })

  describe('subscribe', () => {
    test('should subscribe to cache events', () => {
      const callback = vi.fn()
      const unsubscribe = queryCache.subscribe(callback)
      
      expect(typeof unsubscribe).toBe('function')
      
      // Trigger an event
      queryClient.setQueryData(queryKey(), 'data')
      
      expect(callback).toHaveBeenCalled()
      
      unsubscribe()
    })

    test('should unsubscribe from cache events', () => {
      const callback = vi.fn()
      const unsubscribe = queryCache.subscribe(callback)
      
      unsubscribe()
      
      // Trigger an event after unsubscribe
      queryClient.setQueryData(queryKey(), 'data')
      
      // Should not be called after unsubscribe
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('find', () => {
    test('should find query by key', () => {
      const key = queryKey()
      queryClient.setQueryData(key, 'data')
      
      const query = queryCache.find(key)
      expect(query).toBeDefined()
      expect(query?.queryKey).toEqual(key)
    })

    test('should return undefined for non-existent query', () => {
      const key = queryKey()
      const query = queryCache.find(key)
      expect(query).toBeUndefined()
    })
  })

  describe('findAll', () => {
    test('should find all queries', () => {
      const key1 = queryKey('query1')
      const key2 = queryKey('query2')
      
      queryClient.setQueryData(key1, 'data1')
      queryClient.setQueryData(key2, 'data2')
      
      const queries = queryCache.findAll()
      expect(queries).toHaveLength(2)
    })

    test('should find queries with filters', () => {
      const key1 = queryKey('query1')
      const key2 = queryKey('query2')
      
      queryClient.setQueryData(key1, 'data1')
      queryClient.setQueryData(key2, 'data2')
      
      const queries = queryCache.findAll({ queryKey: key1 })
      expect(queries).toHaveLength(1)
      expect(queries[0].queryKey).toEqual(key1)
    })
  })

  describe('add', () => {
    test('should add query to cache', () => {
      const key = queryKey()
      const callback = vi.fn()
      
      queryCache.subscribe(callback)
      queryClient.setQueryData(key, 'data')
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'added',
          query: expect.objectContaining({
            queryKey: key,
          }),
        })
      )
    })

    test('should not add duplicate query', () => {
      const key = queryKey()
      const callback = vi.fn()
      
      queryCache.subscribe(callback)
      queryClient.setQueryData(key, 'data1')
      queryClient.setQueryData(key, 'data2')
      
      // Should only be called once for the same key
      const addCalls = callback.mock.calls.filter(call => call[0].type === 'added')
      expect(addCalls).toHaveLength(1)
    })
  })

  describe('remove', () => {
    test('should remove query from cache', () => {
      const key = queryKey()
      const callback = vi.fn()
      
      queryCache.subscribe(callback)
      queryClient.setQueryData(key, 'data')
      queryClient.removeQueries({ queryKey: key })
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'removed',
          query: expect.objectContaining({
            queryKey: key,
          }),
        })
      )
    })
  })

  describe('clear', () => {
    test('should clear all queries', () => {
      const key1 = queryKey('query1')
      const key2 = queryKey('query2')
      const callback = vi.fn()
      
      queryCache.subscribe(callback)
      queryClient.setQueryData(key1, 'data1')
      queryClient.setQueryData(key2, 'data2')
      
      queryCache.clear()
      
      expect(queryCache.size).toBe(0)
      
      // Should trigger remove events for all queries
      const removeCalls = callback.mock.calls.filter(call => call[0].type === 'removed')
      expect(removeCalls).toHaveLength(2)
    })
  })

  describe('build', () => {
    test('should build query with options', () => {
      const key = queryKey()
      const options = {
        queryKey: key,
        queryFn: () => 'data',
      }
      
      const query = queryCache.build(queryClient, options)
      
      expect(query).toBeDefined()
      expect(query.queryKey).toEqual(key)
    })

    test('should reuse existing query', () => {
      const key = queryKey()
      const options = {
        queryKey: key,
        queryFn: () => 'data',
      }
      
      const query1 = queryCache.build(queryClient, options)
      const query2 = queryCache.build(queryClient, options)
      
      expect(query1).toBe(query2)
    })
  })

  describe('size', () => {
    test('should return correct cache size', () => {
      expect(queryCache.size).toBe(0)
      
      queryClient.setQueryData(queryKey('query1'), 'data1')
      expect(queryCache.size).toBe(1)
      
      queryClient.setQueryData(queryKey('query2'), 'data2')
      expect(queryCache.size).toBe(2)
      
      queryClient.removeQueries({ queryKey: queryKey('query1') })
      expect(queryCache.size).toBe(1)
    })
  })
})
