import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@mfestack/react'

// Public API functions (JSONPlaceholder)
const fetchUser = async (userId: string) => {
  if (userId === 'error') {
    throw new Error('User not found')
  }
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error(`Failed to fetch user (${res.status})`)
  const u = await res.json()
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username ?? u.id}`,
    company: u.company?.name ?? 'Unknown',
    city: u.address?.city ?? 'Unknown',
    lastLogin: new Date().toISOString(),
  }
}

const fetchPosts = async (userId: string) => {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error(`Failed to fetch posts (${res.status})`)
  const items: Array<{ id: number; title: string; body: string }> = await res.json()
  return items.slice(0, 5).map(p => ({
    id: p.id,
    title: p.title,
    content: p.body,
    createdAt: new Date().toISOString(),
  }))
}

export function QueryDemo() {
  const [userId, setUserId] = useState('1')
  

  // Stable query fns to avoid re-creating observer on every render
  const userQueryFn = useCallback(() => fetchUser(userId), [userId])
  const postsQueryFn = useCallback(() => fetchPosts(userId), [userId])
  const errorQueryFn = useCallback(() => fetchUser('error'), [])

  const userKey = useMemo(() => ['user', userId] as const, [userId])
  const postsKey = useMemo(() => ['posts', userId] as const, [userId])
  const errorKey = useMemo(() => ['user', 'error'] as const, [])

  // Basic query
  const userQuery = useQuery({
    queryKey: userKey,
    queryFn: userQueryFn,
    enabled: !!userId,
  })

  // Dependent query
  const postsQuery = useQuery({
    queryKey: postsKey,
    queryFn: postsQueryFn,
    enabled: !!userQuery.data && !userQuery.isError,
  })

  // Error query
  const errorQuery = useQuery({
    queryKey: errorKey,
    queryFn: errorQueryFn,
    enabled: false, // Start disabled
  })

  const handleUserIdChange = (newUserId: string) => {
    setUserId(newUserId)
  }

  const triggerError = () => {
    errorQuery.refetch()
  }

  return (
    <div className="demo-grid">
      <div className="demo-card">
        <h3>🔍 Basic Query</h3>
        <p>Fetch user data with loading states and error handling</p>
        
        <input
          type="text"
          className="input"
          placeholder="Enter user ID (1-5, or 'error' for error demo)"
          value={userId}
          onChange={(e) => handleUserIdChange(e.target.value)}
        />
        
        <div className="status loading" style={{ display: userQuery.isLoading ? 'block' : 'none' }}>
          ⏳ Loading user...
        </div>
        
        <div className="status error" style={{ display: userQuery.isError ? 'block' : 'none' }}>
          ❌ Error: {userQuery.error?.message}
        </div>
        
        <div className="status success" style={{ display: userQuery.isSuccess ? 'block' : 'none' }}>
          ✅ User loaded successfully
        </div>
        
        {userQuery.data && (
          <div className="data-display">
            <pre>{JSON.stringify(userQuery.data, null, 2)}</pre>
          </div>
        )}
        
        <button 
          className="button primary" 
          onClick={() => userQuery.refetch()}
          disabled={userQuery.isFetching}
        >
          {userQuery.isFetching ? 'Refreshing...' : 'Refetch User'}
        </button>
      </div>

      <div className="demo-card">
        <h3>🔗 Dependent Query</h3>
        <p>Fetch posts only after user data is loaded</p>
        
        <div className="status loading" style={{ display: postsQuery.isLoading ? 'block' : 'none' }}>
          ⏳ Loading posts...
        </div>
        
        <div className="status error" style={{ display: postsQuery.isError ? 'block' : 'none' }}>
          ❌ Error: {postsQuery.error?.message}
        </div>
        
        <div className="status success" style={{ display: postsQuery.isSuccess ? 'block' : 'none' }}>
          ✅ Posts loaded successfully
        </div>
        
        {postsQuery.data && (
          <div className="data-display">
            <pre>{JSON.stringify(postsQuery.data, null, 2)}</pre>
          </div>
        )}
        
        <button 
          className="button primary" 
          onClick={() => postsQuery.refetch()}
          disabled={postsQuery.isFetching || !userQuery.data}
        >
          {postsQuery.isFetching ? 'Refreshing...' : 'Refetch Posts'}
        </button>
      </div>

      <div className="demo-card">
        <h3>❌ Error Handling</h3>
        <p>Demonstrate error states and retry functionality</p>
        
        <div className="status loading" style={{ display: errorQuery.isLoading ? 'block' : 'none' }}>
          ⏳ Loading...
        </div>
        
        <div className="status error" style={{ display: errorQuery.isError ? 'block' : 'none' }}>
          ❌ Error: {errorQuery.error?.message}
        </div>
        
        <div className="status success" style={{ display: errorQuery.isSuccess ? 'block' : 'none' }}>
          ✅ Success (unexpected!)
        </div>
        
        <button 
          className="button danger" 
          onClick={triggerError}
          disabled={errorQuery.isFetching}
        >
          {errorQuery.isFetching ? 'Loading...' : 'Trigger Error Query'}
        </button>
      </div>
    </div>
  )
}
