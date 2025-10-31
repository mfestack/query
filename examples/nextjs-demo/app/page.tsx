import Link from 'next/link'
import { UserDemo } from './components/UserDemo'
import { PostsDemo } from './components/PostsDemo'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          🚀 MFestack Query - Next.js SSR Demo
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          This demo shows server-side prefetching, dehydration, and client hydration with MFestack Query.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">👤 User Query (SSR)</h2>
            <p className="text-gray-600 mb-4">
              This data was prefetched on the server and hydrated on the client.
            </p>
            <UserDemo userId="1" />
          </div>

          <div className="border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">📝 Posts Query (SSR)</h2>
            <p className="text-gray-600 mb-4">
              Dependent query that fetches after user data is loaded.
            </p>
            <PostsDemo userId="1" />
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">✨ Features Demonstrated</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Server-side prefetching with Next.js App Router</li>
            <li>Dehydration of query cache on the server</li>
            <li>Client-side hydration for instant data display</li>
            <li>No refetch on initial client render (uses hydrated data)</li>
            <li>Automatic refetch on window focus (if stale)</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/about"
            className="text-blue-600 hover:underline"
          >
            → View About Page (Different Route)
          </Link>
        </div>
      </div>
    </main>
  )
}
