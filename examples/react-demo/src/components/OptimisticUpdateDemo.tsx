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
  const tempIdRef = { current: 0 } // Use a ref to track temp IDs

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
  type CreateTodoContext = { previousTodos?: Todo[]; tempId?: number }
  
  const createTodo = useMutation<Todo, Error, string>({
    mutationFn: async (title: string): Promise<Todo> => {
      console.log('mutationFn', title)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return {
        id: Date.now(),
        title,
        completed: false,
      }
    },
    onMutate: async (title: string): Promise<CreateTodoContext> => {
      console.log('onMutate', title)
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      // Generate unique temporary ID (using timestamp + counter)
      tempIdRef.current = tempIdRef.current - 1 // Use negative IDs for temp items
      const tempId = tempIdRef.current

      // Optimistically update cache
      const newTodo: Todo = {
        id: tempId, // Temporary ID (negative)
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
      const ctx = context as CreateTodoContext | undefined
      if (ctx?.previousTodos) {
        queryClient.setQueryData(['todos'], ctx.previousTodos)
      }
    },
    onSuccess: (newTodo, _variables, context) => {
      // Replace temporary ID with real ID from server
      const ctx = context as CreateTodoContext | undefined
      if (ctx?.tempId !== undefined) {
        queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>
          old.map((todo) =>
            todo.id === ctx.tempId ? newTodo : todo
          )
        )
      }
    },
  })

  // Toggle todo mutation with optimistic update
  type ToggleTodoContext = { previousTodos?: Todo[] }
  
  const toggleTodo = useMutation<Todo, Error, Todo>({
    mutationFn: async (todo: Todo): Promise<Todo> => {
      console.log('mutationFn', todo)
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { ...todo, completed: !todo.completed }
    },
    onMutate: async (todo): Promise<ToggleTodoContext> => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      // Optimistically update
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>
        old.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
      )

      return { previousTodos }
    },
    onError: (_err, _variables, context) => {
      const ctx = context as ToggleTodoContext | undefined
      if (ctx?.previousTodos) {
        queryClient.setQueryData(['todos'], ctx.previousTodos)
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
            disabled={createTodo.isLoading}
            className="button primary"
          >
            {createTodo.isLoading ? 'Adding...' : 'Add Todo'}
          </button>
        </form>

        {isLoading && <div className="status loading">Loading todos...</div>}

        {createTodo.error && (
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
                  disabled={toggleTodo.isLoading}
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
                {toggleTodo.isLoading && (
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

