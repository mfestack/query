import { Suspense } from 'react'
import { useQuery } from '@mfestack/react'

function UserDetailsInner() {
  const { data } = useQuery({
    queryKey: ['user', 1],
    suspense: true,
    refetchOnWindowFocus: 'always',
    queryFn: async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/users/1')
      if (!res.ok) throw new Error('Failed to load user')
      return res.json()
    },
  })
  if (!data) return null
  return (
    <div>
      <div><strong>Name:</strong> {data?.name}</div>
      <div><strong>Email:</strong> {data?.email}</div>
    </div>
  )
}

export function SuspenseDemo() {
  return (
    <Suspense fallback={<div>Loading user…</div>}>
      <UserDetailsInner />
    </Suspense>
  )
}


