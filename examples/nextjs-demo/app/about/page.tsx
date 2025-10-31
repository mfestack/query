import { getQueryClient, prefetchQuery, getDehydratedState } from '../../lib/utils'
import { fetchUser } from '../../lib/utils'
import { AboutClient } from './AboutClient'
import Link from 'next/link'

export default async function AboutPage() {
  const queryClient = getQueryClient()
  
  // Prefetch different data for this route
  await prefetchQuery(queryClient, ['user', '2'], () => fetchUser('2'))
  
  const dehydratedState = getDehydratedState(queryClient)

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-4">About Page</h1>
        <p className="text-lg text-gray-600 mb-8">
          This page demonstrates route-level data prefetching. The user data was prefetched on the server.
        </p>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__MFESTACK_STATE_ABOUT__ = ${JSON.stringify(dehydratedState)}`,
          }}
        />
        <AboutClient />
      </div>
    </main>
  )
}

