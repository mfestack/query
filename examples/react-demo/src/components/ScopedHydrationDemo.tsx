import { useState, useEffect } from 'react'
import { QueryClient, ClientRegistry, hydrateScope, dehydrateScope, type QueryClientScope, type QueryState } from '@mfestack/core'

/**
 * Example: Scoped Hydration
 * 
 * This demonstrates how to use ClientRegistry and scoped hydration
 * to manage multiple isolated QueryClient instances.
 */

interface User {
  id: number
  name: string
  email: string
}

const SCOPE_A: QueryClientScope = 'scope-a'
const SCOPE_B: QueryClientScope = 'scope-b'

interface JsonPlaceholderUser {
  id: number
  name: string
  email: string
}

function fetchUser(userId: number): Promise<User> {
  return fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
    .then(res => res.json())
    .then((u: JsonPlaceholderUser) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    }))
}

export function ScopedHydrationDemo() {
  const [currentScope, setCurrentScope] = useState<QueryClientScope>(SCOPE_A)
  const [scopeData, setScopeData] = useState<Record<string, { data?: User; isLoading: boolean }>>({})
  const [allScopes, setAllScopes] = useState<QueryClientScope[]>([])

  // Initialize scopes
  useEffect(() => {
    if (!ClientRegistry.has(SCOPE_A)) {
      const clientA = new QueryClient()
      ClientRegistry.register(SCOPE_A, clientA, {
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
    }

    if (!ClientRegistry.has(SCOPE_B)) {
      const clientB = new QueryClient()
      ClientRegistry.register(SCOPE_B, clientB, {
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds - different policy
          },
        },
      })
    }

    setAllScopes(ClientRegistry.listScopes())

    // Fetch data for current scope
    const scopeClient = ClientRegistry.get(currentScope)!
    setScopeData(prev => ({ ...prev, [String(currentScope)]: { isLoading: true } }))
    
    scopeClient.fetchQuery({
      queryKey: ['user', currentScope],
      queryFn: () => fetchUser(1),
    }).then((data: User) => {
      setScopeData(prev => ({
        ...prev,
        [String(currentScope)]: { data, isLoading: false },
      }))
    }).catch(() => {
      setScopeData(prev => ({
        ...prev,
        [String(currentScope)]: { isLoading: false },
      }))
    })
  }, [currentScope])

  // Dehydrate and hydrate handlers
  const handleDehydrate = () => {
    const state = dehydrateScope(currentScope)
    alert(`Dehydrated scope: ${String(currentScope)}\nQueries: ${state.queries.length}\nMutations: ${state.mutations.length}`)
  }

  const handleHydrate = () => {
    // Create sample dehydrated state with full QueryState
    const baseState: QueryState<User> = {
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

    const sampleState = {
      queries: [
        {
          queryKey: ['user', currentScope] as const,
          queryHash: JSON.stringify(['user', currentScope]),
          state: {
            ...baseState,
            data: { id: 999, name: 'Hydrated User', email: 'hydrated@example.com' },
          } as QueryState<User>,
        },
      ],
      mutations: [],
    }

    hydrateScope(currentScope, sampleState, { mergeStrategy: 'preferServer' })
    
    // Update local state to reflect hydrated data
    const scopeClient = ClientRegistry.get(currentScope)!
    const hydratedData = scopeClient.getQueryData<User>(['user', currentScope])
    if (hydratedData) {
      setScopeData(prev => ({
        ...prev,
        [String(currentScope)]: { data: hydratedData, isLoading: false },
      }))
    }
    
    alert(`Hydrated scope: ${String(currentScope)} with sample data`)
  }

  const currentData = scopeData[String(currentScope)]

  return (
    <div className="demo-grid">
      <div className="demo-card">
        <h3>🔐 Scoped Hydration Demo</h3>
        <p>
          This demo shows how to use ClientRegistry to manage multiple isolated
          QueryClient instances and perform scoped hydration/dehydration.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            <strong>Current Scope:</strong>
            <select
              value={String(currentScope)}
              onChange={(e) => setCurrentScope(e.target.value as QueryClientScope)}
              style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
            >
              <option value={String(SCOPE_A)}>Scope A (60s staleTime)</option>
              <option value={String(SCOPE_B)}>Scope B (30s staleTime)</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p>
            <strong>Registered Scopes:</strong>{' '}
            {allScopes.map(s => String(s)).join(', ')}
          </p>
        </div>

        {currentData?.isLoading && (
          <div className="status loading">Loading user...</div>
        )}

        {currentData?.data && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
            <div><strong>Name:</strong> {currentData.data.name}</div>
            <div><strong>Email:</strong> {currentData.data.email}</div>
            <div><strong>ID:</strong> {currentData.data.id}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="button primary"
            onClick={handleDehydrate}
          >
            Dehydrate Scope
          </button>
          <button
            className="button primary"
            onClick={handleHydrate}
          >
            Hydrate Scope (Sample Data)
          </button>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
          <p><strong>Features demonstrated:</strong></p>
          <ul style={{ textAlign: 'left', marginLeft: '1.5rem' }}>
            <li>Multiple isolated QueryClient instances</li>
            <li>Per-scope policies (different staleTime)</li>
            <li>Scoped dehydration and hydration</li>
            <li>Scope switching</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

