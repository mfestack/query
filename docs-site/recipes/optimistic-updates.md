# Optimistic Updates

Update the UI immediately while a mutation is in progress, then rollback on error.

## Basic Optimistic Update

```tsx
import { useMutation, useQueryClient } from '@mfestack/react'

function TodoList() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: updateTodo,
    // Optimistically update the cache
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos'])

      // Optimistically update
      queryClient.setQueryData(['todos'], (old: Todo[] = []) => [
        ...old,
        { ...newTodo, id: Date.now() },
      ])

      return { previousTodos }
    },
    // Rollback on error
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <button onClick={() => mutation.mutate({ text: 'New Todo' })}>
      Add Todo
    </button>
  )
}
```

## Update Single Item

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (updatedTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData(['todos'])

    queryClient.setQueryData(['todos'], (old: Todo[] = []) =>
      old.map(todo =>
        todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo
      )
    )

    return { previousTodos }
  },
  onError: (err, updatedTodo, context) => {
    queryClient.setQueryData(['todos'], context?.previousTodos)
  },
})
```

