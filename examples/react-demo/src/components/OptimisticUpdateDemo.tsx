import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@mfestack/react'

/**
 * Example: Optimistic Updates
 * 
 * This demonstrates how to update the cache optimistically
 * before the mutation completes, providing instant UI feedback.
 */

interface Todo {
  id: number
  title: string
  completed: boolean
}

export function OptimisticUpdateDemo() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState('')

  // Fetch todos
  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      return [
        { id: 1, title: 'Learn MFEStack Query', completed: false },
        { id: 2, title: 'Build amazing apps', completed: true },
      ]
    },
  })

  // Create todo mutation with optimistic update
  const createTodo = useMutation({
    mutationFn: async (data: { title: string; tempId: number }): Promise<Todo> => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return {
        id: Date.now(),
        title: data.title,
        completed: false,
      }
    },
    onMutate: async (title: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      // Generate temporary ID
      const tempId = Date.now()

      // Optimistically update cache
      const newTodo: Todo = {
        id: tempId, // Temporary ID
        title,
        completed: false,
      }

      queryClient.setQueryData<Todo[]>(['todos'], (old = []) => [
        ...old,
        newTodo,
      ])

      // Return context for rollback
      return { previousTodos, tempId }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
    onSuccess: (newTodo, _variables, context) => {
      // Replace temporary ID with real ID from server
      if (context?.tempId) {
        queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>
          old.map((todo) =>
            todo.id === context.tempId ? newTodo : todo
          )
        )
      }
    },
  })

  // Toggle todo mutation with optimistic update
  const toggleTodo = useMutation({
    mutationFn: async (todo: Todo): Promise<Todo> => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { ...todo, completed: !todo.completed }
    },
    onMutate: async (todo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      // Optimistically update
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>
        old.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
      )

      return { previousTodos }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      createTodo.mutate(inputValue.trim())
      setInputValue('')
    }
  }

  return (
    <div className="demo-grid">
      <div className="demo-card">
        <h3>⚡ Optimistic Updates</h3>
        <p>
          Updates appear instantly in the UI before the server responds.
          If the mutation fails, the UI rolls back automatically.
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a todo..."
            style={{
              padding: '8px',
              marginRight: '8px',
              width: '200px',
            }}
          />
          <button
            type="submit"
            disabled={createTodo.isPending}
            className="button primary"
          >
            {createTodo.isPending ? 'Adding...' : 'Add Todo'}
          </button>
        </form>

        {isLoading && <div className="status loading">Loading todos...</div>}

        {createTodo.isError && (
          <div className="status error">
            Failed to create todo: {createTodo.error?.message}
          </div>
        )}

        {todos.length > 0 && (
          <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0 }}>
            {todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  padding: '8px',
                  marginBottom: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo.mutate(todo)}
                  disabled={toggleTodo.isPending}
                />
                <span
                  style={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#999' : '#000',
                    flex: 1,
                  }}
                >
                  {todo.title}
                </span>
                {toggleTodo.isPending && (
                  <span style={{ fontSize: '0.8em', color: '#666' }}>
                    Updating...
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

