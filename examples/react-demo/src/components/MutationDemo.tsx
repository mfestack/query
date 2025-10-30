import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@mfestack/react'

// Public API (JSONPlaceholder accepts POST and echoes created object)
const saveNote = async (note: { id?: number; text: string }) => {
  if (!note.text.trim()) throw new Error('Note cannot be empty')
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: note.text, body: note.text, userId: 1 }),
  })
  if (!res.ok) throw new Error(`Failed to save note (${res.status})`)
  const data = await res.json()
  return { id: data.id ?? Math.floor(Math.random() * 10000), text: note.text }
}

const fetchNotes = async () => {
  await new Promise(r => setTimeout(r, 400))
  return [
    { id: 1, text: 'Welcome to MFestack Query!' },
    { id: 2, text: 'Try creating a new note below.' },
  ]
}

export function MutationDemo() {
  const qc = useQueryClient()
  const [text, setText] = useState('')

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  })

  const mutationFn = useCallback((t: { text: string }) => saveNote(t), [])

  const createMutation = useMutation({
    mutationKey: ['create-note'],
    mutationFn,
    onSuccess: async (data: { id: number; text: string }) => {
      // Optimistically update cache
      const prev = (notesQuery.data ?? []) as Array<{ id: number; text: string }>
      qc.setQueryData(['notes'], [...prev, data])
      setText('')
    },
  })

  return (
    <div className="demo-card">
      <h3>📝 Create Note</h3>
      <p>Create a note and update the cached list on success.</p>

      <input
        className="input"
        placeholder="Type a note..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="status loading" style={{ display: createMutation.isLoading ? 'inline-block' : 'none' }}>
        Saving...
      </div>
      <div className="status error" style={{ display: createMutation.error ? 'inline-block' : 'none' }}>
        {String(createMutation.error)}
      </div>

      <div>
        <button
          className="button primary"
          disabled={!text.trim() || createMutation.isLoading}
          onClick={() => createMutation.mutate({ text })}
        >
          {createMutation.isLoading ? 'Saving...' : 'Save Note'}
        </button>
      </div>

      <div className="data-display">
        <pre>{JSON.stringify(notesQuery.data ?? [], null, 2)}</pre>
      </div>
    </div>
  )
}


