import { useQuery } from '@mfestack/react'

export function FocusReconnectDemo() {
  const { data, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['time'],
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
      if (!res.ok) throw new Error('Failed to fetch time')
      const json = await res.json()
      return { utc: json.utc_datetime }
    },
  })

  return (
    <div>
      <div><strong>UTC time:</strong> {data?.utc ?? '—'}</div>
      <div><strong>Last update:</strong> {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}</div>
      <div>{isFetching ? 'Fetching…' : 'Idle'}</div>
      <button onClick={() => refetch()}>Manual Refetch</button>
      <p style={{ marginTop: 8 }}>
        Tip: switch tabs and come back or toggle network to see auto-refetch.
      </p>
    </div>
  )
}


