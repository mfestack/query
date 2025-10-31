import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@mfestack/react'

// API functions
const fetchTodo = async (id: number) => {
  const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)
  return res.json()
}

const createTodo = async (title: string) => {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, completed: false, userId: 1 }),
  })
  if (!res.ok) throw new Error(`Failed to create (${res.status})`)
  return res.json()
}

export function DevToolsDemo() {
  const queryClient = useQueryClient()
  const [todoId, setTodoId] = useState(1)
  const [newTodoTitle, setNewTodoTitle] = useState('')

  // Multiple queries to showcase in DevTools
  const todo1Query = useQuery({
    queryKey: ['todo', 1],
    queryFn: () => fetchTodo(1),
    staleTime: 5000,
  })

  const todo2Query = useQuery({
    queryKey: ['todo', 2],
    queryFn: () => fetchTodo(2),
    staleTime: 5000,
  })

  const dynamicTodoQuery = useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => fetchTodo(todoId),
    enabled: todoId > 0 && todoId <= 200,
  })

  const createMutation = useMutation({
    mutationKey: ['create-todo'],
    mutationFn: (title: string) => createTodo(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo'] })
    },
  })

  const handleInvalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['todo'] })
  }

  const handleRefetchAll = () => {
    queryClient.refetchQueries({ queryKey: ['todo'] })
  }

  const handleRemoveAll = () => {
    queryClient.removeQueries({ queryKey: ['todo'] })
  }

  return (
    <div className="demo-card" style={{ maxWidth: '100%' }}>
      <h3>🔧 DevTools Demo</h3>
      <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
        <p style={{ marginBottom: '0.5rem' }}>
          This demo creates multiple queries and mutations. Open DevTools (bottom-right button) to see:
        </p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Multiple queries in the Queries panel</li>
          <li>Mutations in the Mutations panel</li>
          <li>Events in the Events panel</li>
          <li>Cache statistics in the Cache panel</li>
        </ul>
      </div>

      <div className="demo-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div>
          <h4>Query 1 (Static)</h4>
          {todo1Query.isLoading && <div className="status loading">Loading...</div>}
          {todo1Query.isError && <div className="status error">Error: {String(todo1Query.error)}</div>}
          {todo1Query.isSuccess && (
            <div className="status success">
              ✅ {todo1Query.data?.title}
            </div>
          )}
          <button 
            className="button primary" 
            onClick={() => todo1Query.refetch()}
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            Refetch
          </button>
        </div>

        <div>
          <h4>Query 2 (Static)</h4>
          {todo2Query.isLoading && <div className="status loading">Loading...</div>}
          {todo2Query.isError && <div className="status error">Error: {String(todo2Query.error)}</div>}
          {todo2Query.isSuccess && (
            <div className="status success">
              ✅ {todo2Query.data?.title}
            </div>
          )}
          <button 
            className="button primary" 
            onClick={() => todo2Query.refetch()}
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            Refetch
          </button>
        </div>

        <div>
          <h4>Dynamic Query</h4>
          <input
            type="number"
            className="input"
            placeholder="Todo ID (1-200)"
            value={todoId}
            onChange={(e) => setTodoId(Number(e.target.value))}
            style={{ marginBottom: '0.5rem' }}
          />
          {dynamicTodoQuery.isLoading && <div className="status loading">Loading...</div>}
          {dynamicTodoQuery.isError && <div className="status error">Error: {String(dynamicTodoQuery.error)}</div>}
          {dynamicTodoQuery.isSuccess && (
            <div className="status success">
              ✅ {dynamicTodoQuery.data?.title}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h4>Create New Todo</h4>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input
            className="input"
            placeholder="Todo title..."
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="button primary"
            disabled={!newTodoTitle.trim() || createMutation.isLoading}
            onClick={() => {
              createMutation.mutate(newTodoTitle)
              setNewTodoTitle('')
            }}
          >
            {createMutation.isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
        {createMutation.isError && (
          <div className="status error" style={{ marginTop: '0.5rem' }}>
            Error: {String(createMutation.error)}
          </div>
        )}
        {createMutation.isSuccess && (
          <div className="status success" style={{ marginTop: '0.5rem' }}>
            ✅ Todo created! Check Mutations panel in DevTools.
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
        <h4>Bulk Actions (Try in DevTools too!)</h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button 
            className="button" 
            onClick={handleInvalidateAll}
            style={{ background: '#ffc107', color: '#000' }}
          >
            Invalidate All Todos
          </button>
          <button 
            className="button" 
            onClick={handleRefetchAll}
            style={{ background: '#17a2b8', color: '#fff' }}
          >
            Refetch All Todos
          </button>
          <button 
            className="button danger" 
            onClick={handleRemoveAll}
          >
            Remove All Todos
          </button>
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#856404' }}>
          💡 These actions are also available in DevTools Queries panel for individual queries!
        </p>
      </div>
    </div>
  )
}

