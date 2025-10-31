import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient } from '../client/QueryClient'
import { ClientRegistry, type QueryClientScope } from '../client/ClientRegistry'
import {
  hydrateScope,
  dehydrateScope,
  dehydrateScopes,
  hydrateScopes,
} from '../hydration/hydration'
import type { QueryState } from '../types/queryTypes'

describe('Scoped Hydration', () => {
  beforeEach(() => {
    ClientRegistry.clear()
  })

  describe('hydrateScope', () => {
    it('should hydrate a registered scope', () => {
      const scope: QueryClientScope = 'scope1'
      const client = new QueryClient()
      ClientRegistry.register(scope, client)

      const dehydratedState = {
        queries: [
          {
            queryKey: ['user', 1],
            queryHash: '["user",1]',
            state: {
              data: { id: 1, name: 'Alice' },
              status: 'success' as const,
              dataUpdatedAt: Date.now(),
              error: null,
              errorUpdatedAt: 0,
              failureCount: 0,
              failureReason: null,
              fetchStatus: 'idle' as const,
              isError: false,
              isFetched: true,
              isFetchedAfterMount: true,
              isFetching: false,
              isInitialLoading: false,
              isLoading: false,
              isInvalidated: false,
              isPaused: false,
              isPending: false,
              isPlaceholderData: false,
              isRefetching: false,
              isStale: false,
              isSuccess: true,
              fetchMeta: null,
            } as QueryState<{ id: number; name: string }>,
          },
        ],
        mutations: [],
      }

      hydrateScope(scope, dehydratedState)

      const data = client.getQueryData(['user', 1])
      expect(data).toEqual({ id: 1, name: 'Alice' })
    })

    it('should throw error for unregistered scope', () => {
      const dehydratedState = {
        queries: [],
        mutations: [],
      }

      expect(() => {
        hydrateScope('nonexistent' as QueryClientScope, dehydratedState)
      }).toThrow('No QueryClient registered for scope: nonexistent')
    })

    it('should support preferClient merge strategy', () => {
      const scope: QueryClientScope = 'scope1'
      const client = new QueryClient()
      ClientRegistry.register(scope, client)

      // Set existing data
      client.setQueryData(['user', 1], { id: 1, name: 'Bob' })

      const baseState: QueryState = {
        data: undefined,
        status: 'success',
        dataUpdatedAt: Date.now(),
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        isError: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isInitialLoading: false,
        isLoading: false,
        isInvalidated: false,
        isPaused: false,
        isPending: false,
        isPlaceholderData: false,
        isRefetching: false,
        isStale: false,
        isSuccess: true,
        fetchMeta: null,
      }

      const dehydratedState = {
        queries: [
          {
            queryKey: ['user', 1],
            queryHash: '["user",1]',
            state: { ...baseState, data: { id: 1, name: 'Alice' } },
          },
          {
            queryKey: ['user', 2],
            queryHash: '["user",2]',
            state: { ...baseState, data: { id: 2, name: 'Charlie' } },
          },
        ],
        mutations: [],
      }

      hydrateScope(scope, dehydratedState, { mergeStrategy: 'preferClient' })

      // Existing data should be preserved
      expect(client.getQueryData(['user', 1])).toEqual({ id: 1, name: 'Bob' })
      // New data should be hydrated
      expect(client.getQueryData(['user', 2])).toEqual({ id: 2, name: 'Charlie' })
    })

    it('should support mergeStructural strategy', () => {
      const scope: QueryClientScope = 'scope1'
      const client = new QueryClient()
      ClientRegistry.register(scope, client)

      // Set existing nested data
      client.setQueryData(['user', 1], {
        id: 1,
        name: 'Bob',
        profile: { age: 30 },
      })

      const baseState: QueryState = {
        data: undefined,
        status: 'success',
        dataUpdatedAt: Date.now(),
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        isError: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isInitialLoading: false,
        isLoading: false,
        isInvalidated: false,
        isPaused: false,
        isPending: false,
        isPlaceholderData: false,
        isRefetching: false,
        isStale: false,
        isSuccess: true,
        fetchMeta: null,
      }

      const dehydratedState = {
        queries: [
          {
            queryKey: ['user', 1],
            queryHash: '["user",1]',
            state: {
              ...baseState,
              data: {
                id: 1,
                name: 'Alice',
                profile: { age: 25, city: 'NYC' },
              },
            },
          },
        ],
        mutations: [],
      }

      hydrateScope(scope, dehydratedState, { mergeStrategy: 'mergeStructural' })

      const data = client.getQueryData(['user', 1])
      // Should merge deeply
      expect(data).toEqual({
        id: 1,
        name: 'Alice', // Server takes precedence for top-level
        profile: { age: 25, city: 'NYC' }, // Merged structure
      })
    })
  })

  describe('dehydrateScope', () => {
    it('should dehydrate a registered scope', () => {
      const scope: QueryClientScope = 'scope1'
      const client = new QueryClient()
      ClientRegistry.register(scope, client)

      client.setQueryData(['user', 1], { id: 1, name: 'Alice' })

      const state = dehydrateScope(scope)

      expect(state.queries).toHaveLength(1)
      expect(state.queries[0].queryKey).toEqual(['user', 1])
    })

    it('should throw error for unregistered scope', () => {
      expect(() => {
        dehydrateScope('nonexistent' as QueryClientScope)
      }).toThrow('No QueryClient registered for scope: nonexistent')
    })
  })

  describe('dehydrateScopes', () => {
    it('should dehydrate multiple scopes', () => {
      const scope1: QueryClientScope = 'scope1'
      const scope2: QueryClientScope = 'scope2'
      const client1 = new QueryClient()
      const client2 = new QueryClient()

      ClientRegistry.register(scope1, client1)
      ClientRegistry.register(scope2, client2)

      client1.setQueryData(['user', 1], { id: 1, name: 'Alice' })
      client2.setQueryData(['user', 2], { id: 2, name: 'Bob' })

      const states = dehydrateScopes([scope1, scope2])

      expect(states['scope1'].queries).toHaveLength(1)
      expect(states['scope2'].queries).toHaveLength(1)
      expect(states['scope1'].queries[0].queryKey).toEqual(['user', 1])
      expect(states['scope2'].queries[0].queryKey).toEqual(['user', 2])
    })

    it('should skip unregistered scopes', () => {
      const scope1: QueryClientScope = 'scope1'
      const client1 = new QueryClient()

      ClientRegistry.register(scope1, client1)
      client1.setQueryData(['user', 1], { id: 1 })

      const states = dehydrateScopes([scope1, 'nonexistent' as QueryClientScope])

      expect(Object.keys(states)).toEqual(['scope1'])
      expect(states['scope1'].queries).toHaveLength(1)
    })
  })

  describe('hydrateScopes', () => {
    it('should hydrate multiple scopes', () => {
      const scope1: QueryClientScope = 'scope1'
      const scope2: QueryClientScope = 'scope2'
      const client1 = new QueryClient()
      const client2 = new QueryClient()

      ClientRegistry.register(scope1, client1)
      ClientRegistry.register(scope2, client2)

      const baseState: QueryState = {
        data: undefined,
        status: 'success',
        dataUpdatedAt: Date.now(),
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        isError: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isInitialLoading: false,
        isLoading: false,
        isInvalidated: false,
        isPaused: false,
        isPending: false,
        isPlaceholderData: false,
        isRefetching: false,
        isStale: false,
        isSuccess: true,
        fetchMeta: null,
      }

      const states = {
        scope1: {
          queries: [
            {
              queryKey: ['user', 1],
              queryHash: '["user",1]',
              state: { ...baseState, data: { id: 1, name: 'Alice' } },
            },
          ],
          mutations: [],
        },
        scope2: {
          queries: [
            {
              queryKey: ['user', 2],
              queryHash: '["user",2]',
              state: { ...baseState, data: { id: 2, name: 'Bob' } },
            },
          ],
          mutations: [],
        },
      }

      hydrateScopes(states)

      expect(client1.getQueryData(['user', 1])).toEqual({ id: 1, name: 'Alice' })
      expect(client2.getQueryData(['user', 2])).toEqual({ id: 2, name: 'Bob' })
    })
  })
})

