 
import { useQuery, useQueryClient } from '@mfestack/react'

const fetchTime = async () => {
  const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
  if (!res.ok) throw new Error(`Failed to fetch time (${res.status})`)
  const data = await res.json()
  return { now: data.utc_datetime ?? data.datetime }
}

export function CacheDemo() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['time'], queryFn: fetchTime })

  const setPlaceholder = () => {
    qc.setQueryData(['time'], { now: '2000-01-01T00:00:00.000Z' })
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['time'] })
    query.refetch()
  }

  const clear = () => {
    qc.removeQueries({ queryKey: ['time'] })
  }

  return (
    <div className="demo-card">
      <h3>🗃️ Cache Controls</h3>
      <p>Set, invalidate, and remove cached query data.</p>

      <div className="data-display">
        <pre>{JSON.stringify(query.data ?? null, null, 2)}</pre>
      </div>
      {query.isError && (
        <div className="status error">❌ {String(query.error)}</div>
      )}

      <div>
        <button className="button" onClick={() => query.refetch().catch(() => {})} disabled={query.isFetching}>
          {query.isFetching ? 'Refreshing...' : 'Refetch'}
        </button>
        <button className="button" onClick={setPlaceholder}>Set Placeholder</button>
        <button className="button" onClick={() => { invalidate() }}>
          Invalidate
        </button>
        <button className="button danger" onClick={clear}>Remove</button>
      </div>
    </div>
  )
}


