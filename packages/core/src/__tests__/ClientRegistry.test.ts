import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient } from '../client/QueryClient'
import { ClientRegistry, type QueryClientScope, type ScopePolicy } from '../client/ClientRegistry'

describe('ClientRegistry', () => {
  beforeEach(() => {
    ClientRegistry.clear()
  })

  it('should register and retrieve clients by scope', () => {
    const scope1: QueryClientScope = 'scope1'
    const scope2: QueryClientScope = 'scope2'
    const client1 = new QueryClient()
    const client2 = new QueryClient()

    ClientRegistry.register(scope1, client1)
    ClientRegistry.register(scope2, client2)

    expect(ClientRegistry.get(scope1)).toBe(client1)
    expect(ClientRegistry.get(scope2)).toBe(client2)
    expect(ClientRegistry.has(scope1)).toBe(true)
    expect(ClientRegistry.has(scope2)).toBe(true)
  })

  it('should return undefined for unregistered scopes', () => {
    expect(ClientRegistry.get('nonexistent' as QueryClientScope)).toBeUndefined()
    expect(ClientRegistry.has('nonexistent' as QueryClientScope)).toBe(false)
  })

  it('should remove clients from registry', () => {
    const scope: QueryClientScope = 'scope1'
    const client = new QueryClient()

    ClientRegistry.register(scope, client)
    expect(ClientRegistry.has(scope)).toBe(true)

    ClientRegistry.remove(scope)
    expect(ClientRegistry.has(scope)).toBe(false)
    expect(ClientRegistry.get(scope)).toBeUndefined()
  })

  it('should list all registered scopes', () => {
    ClientRegistry.register('scope1', new QueryClient())
    ClientRegistry.register('scope2', new QueryClient())
    ClientRegistry.register(Symbol('scope3'), new QueryClient())

    const scopes = ClientRegistry.listScopes()
    expect(scopes.length).toBe(3)
    expect(scopes).toContain('scope1')
    expect(scopes).toContain('scope2')
  })

  it('should clear all clients', () => {
    ClientRegistry.register('scope1', new QueryClient())
    ClientRegistry.register('scope2', new QueryClient())

    ClientRegistry.clear()

    expect(ClientRegistry.listScopes().length).toBe(0)
    expect(ClientRegistry.get('scope1')).toBeUndefined()
    expect(ClientRegistry.get('scope2')).toBeUndefined()
  })

  describe('scope policies', () => {
    it('should apply policy when registering client', () => {
      const scope: QueryClientScope = 'scope1'
      const client = new QueryClient()
      const policy: ScopePolicy = {
        defaultOptions: {
          queries: {
            staleTime: 5000,
          },
        },
      }

      ClientRegistry.register(scope, client, policy)

      const options = client.getDefaultOptions()
      expect(options.queries?.staleTime).toBe(5000)
    })

    it('should apply plugins from policy', () => {
      const scope: QueryClientScope = 'scope1'
      const client = new QueryClient()
      const mockPlugin = {
        id: 'test-plugin',
        onInit: vi.fn(),
      }

      const policy: ScopePolicy = {
        plugins: [mockPlugin as any],
      }

      ClientRegistry.register(scope, client, policy)

      expect(mockPlugin.onInit).toHaveBeenCalledWith(client)
    })

    it('should set policy for existing client', () => {
      const scope: QueryClientScope = 'scope1'
      const client = new QueryClient()

      ClientRegistry.register(scope, client)

      const policy: ScopePolicy = {
        defaultOptions: {
          queries: {
            gcTime: 10000,
          },
        },
      }

      ClientRegistry.setPolicy(scope, policy)

      const options = client.getDefaultOptions()
      expect(options.queries?.gcTime).toBe(10000)
    })

    it('should get policy for a scope', () => {
      const scope: QueryClientScope = 'scope1'
      const client = new QueryClient()
      const policy: ScopePolicy = {
        defaultOptions: {
          queries: {
            staleTime: 5000,
          },
        },
      }

      ClientRegistry.register(scope, client, policy)

      const retrievedPolicy = ClientRegistry.getPolicy(scope)
      expect(retrievedPolicy).toEqual(policy)
    })

    it('should apply policy to client registered after policy is set', () => {
      const scope: QueryClientScope = 'scope1'
      const policy: ScopePolicy = {
        defaultOptions: {
          queries: {
            staleTime: 3000,
          },
        },
      }

      ClientRegistry.setPolicy(scope, policy)

      const client = new QueryClient()
      ClientRegistry.register(scope, client)

      const options = client.getDefaultOptions()
      expect(options.queries?.staleTime).toBe(3000)
    })

    it('should support symbol scopes', () => {
      const scope = Symbol('my-scope')
      const client = new QueryClient()
      const policy: ScopePolicy = {
        defaultOptions: {
          queries: {
            staleTime: 2000,
          },
        },
      }

      ClientRegistry.register(scope, client, policy)

      expect(ClientRegistry.get(scope)).toBe(client)
      expect(ClientRegistry.getPolicy(scope)).toEqual(policy)
    })
  })
})

