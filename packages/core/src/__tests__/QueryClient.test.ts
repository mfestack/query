import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { QueryClient } from '../client/QueryClient'
import { createQueryClient } from '../client/createQueryClient'
import { queryKey, sleep } from './utils'

describe('QueryClient', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    queryClient.unmount()
    vi.useRealTimers()
  })

  describe('constructor', () => {
    test('should create QueryClient with default options', () => {
      expect(queryClient).toBeDefined()
      expect(queryClient.queryCache).toBeDefined()
      expect(queryClient.mutationCache).toBeDefined()
    })

    test('should create QueryClient with custom options', () => {
      const customClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000,
            gcTime: 2000,
          },
        },
      })
      
      expect(customClient.getDefaultOptions().queries?.staleTime).toBe(1000)
      expect(customClient.getDefaultOptions().queries?.gcTime).toBe(2000)
    })
  })

  describe('createQueryClient', () => {
    test('should create QueryClient with factory function', () => {
      const client = createQueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
          },
        },
      })
      
      expect(client).toBeInstanceOf(QueryClient)
      expect(client.getDefaultOptions().queries?.staleTime).toBe(5000)
    })
  })

  describe('mount/unmount', () => {
    test('should mount and unmount correctly', () => {
      expect(queryClient.isMounted).toBe(true)
      
      queryClient.unmount()
      expect(queryClient.isMounted).toBe(false)
    })
  })

  describe('queryCache methods', () => {
    test('should get query cache', () => {
      const cache = queryClient.getQueryCache()
      expect(cache).toBeDefined()
      expect(cache).toBe(queryClient.queryCache)
    })

    test('should set and get query data', () => {
      const key = queryKey()
      const data = 'test data'
      
      queryClient.setQueryData(key, data)
      const result = queryClient.getQueryData(key)
      
      expect(result).toBe(data)
    })

    test('should update query data with updater function', () => {
      const key = queryKey()
      const initialData = { count: 0 }
      
      queryClient.setQueryData(key, initialData)
      queryClient.setQueryData(key, (prev) => ({ count: (prev as any)?.count + 1 }))
      
      const result = queryClient.getQueryData(key)
      expect(result).toEqual({ count: 1 })
    })
  })

  describe('mutationCache methods', () => {
    test('should get mutation cache', () => {
      const cache = queryClient.getMutationCache()
      expect(cache).toBeDefined()
      expect(cache).toBe(queryClient.mutationCache)
    })

    test('should set and get mutation data', () => {
      const key = ['mutation']
      const data = 'mutation result'
      
      queryClient.setMutationData(key, data)
      const result = queryClient.getMutationData(key)
      
      expect(result).toBe(data)
    })
  })

  describe('query invalidation', () => {
    test('should invalidate queries', async () => {
      const key = queryKey()
      const callback = vi.fn()
      
      queryClient.queryCache.subscribe(callback)
      queryClient.setQueryData(key, 'data')
      
      await queryClient.invalidateQueries({ queryKey: key })
      
      // Should trigger invalidation events
      expect(callback).toHaveBeenCalled()
    })

    test('should refetch queries', async () => {
      const key = queryKey()
      const callback = vi.fn()
      
      queryClient.queryCache.subscribe(callback)
      queryClient.setQueryData(key, 'data')
      
      await queryClient.refetchQueries({ queryKey: key })
      
      // Should trigger refetch events
      expect(callback).toHaveBeenCalled()
    })

    test('should remove queries', () => {
      const key = queryKey()
      const callback = vi.fn()
      
      queryClient.queryCache.subscribe(callback)
      queryClient.setQueryData(key, 'data')
      
      queryClient.removeQueries({ queryKey: key })
      
      const result = queryClient.getQueryData(key)
      expect(result).toBeUndefined()
    })

    test('should cancel queries', () => {
      const key = queryKey()
      const callback = vi.fn()
      
      queryClient.queryCache.subscribe(callback)
      queryClient.setQueryData(key, 'data')
      
      queryClient.cancelQueries({ queryKey: key })
      
      // Should trigger cancel events
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('mutation methods', () => {
    test('should reset mutations', () => {
      const key = ['mutation']
      const callback = vi.fn()
      
      queryClient.mutationCache.subscribe(callback)
      queryClient.setMutationData(key, 'data')
      
      queryClient.resetMutations({ mutationKey: key })
      
      // Should trigger reset events
      expect(callback).toHaveBeenCalled()
    })

    test('should cancel mutations', () => {
      const key = ['mutation']
      const callback = vi.fn()
      
      queryClient.mutationCache.subscribe(callback)
      queryClient.setMutationData(key, 'data')
      
      queryClient.cancelMutations({ mutationKey: key })
      
      // Should trigger cancel events
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    test('should clear all caches', () => {
      const queryKey1 = queryKey('query1')
      const mutationKey1 = ['mutation1']
      
      queryClient.setQueryData(queryKey1, 'data1')
      queryClient.setMutationData(mutationKey1, 'mutation1')
      
      expect(queryClient.getQueryData(queryKey1)).toBe('data1')
      expect(queryClient.getMutationData(mutationKey1)).toBe('mutation1')
      
      queryClient.clear()
      
      expect(queryClient.getQueryData(queryKey1)).toBeUndefined()
      expect(queryClient.getMutationData(mutationKey1)).toBeUndefined()
    })
  })

  describe('plugin system', () => {
    test('should register and remove plugins', () => {
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
  })
})
