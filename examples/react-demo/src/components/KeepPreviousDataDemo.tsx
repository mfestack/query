import { useState } from 'react'
import { useQuery } from '@mfestack/react'

export function KeepPreviousDataDemo() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['posts', page],
    keepPreviousData: true,
    queryFn: async () => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=5`)
      if (!res.ok) throw new Error('Failed to load posts')
      return res.json()
    },
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
        <button onClick={() => setPage(p => p + 1)}>Next</button>
        <span>Page: {page}</span>
        {isFetching && <span> Fetching…</span>}
      </div>
      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <ul>
          {data?.map((p: any) => (
            <li key={p.id}>{p.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}


