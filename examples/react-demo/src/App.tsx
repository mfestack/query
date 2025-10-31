import { QueryClient } from '@mfestack/core'
import { QueryClientProvider } from '@mfestack/react'
import { QueryDemo } from './components/QueryDemo'
import { MutationDemo } from './components/MutationDemo'
import { CacheDemo } from './components/CacheDemo'
import { SuspenseDemo } from './components/SuspenseDemo'
import { KeepPreviousDataDemo } from './components/KeepPreviousDataDemo'
import { FocusReconnectDemo } from './components/FocusReconnectDemo'
import { InfiniteQueryDemo } from './components/InfiniteQueryDemo'
import './App.css'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <header className="App-header">
          <h1>🚀 MFestack Query Demo</h1>
          <p>A powerful data-fetching and caching library for React</p>
        </header>
        
        <main className="App-main">
          <div className="demo-section">
            <h2>📊 Query Demo</h2>
            <QueryDemo />
          </div>
          
          <div className="demo-section">
            <h2>✏️ Mutation Demo</h2>
            <MutationDemo />
          </div>
          
          <div className="demo-section">
            <h2>💾 Cache Demo</h2>
            <CacheDemo />
          </div>

          <div className="demo-section">
            <h2>⏳ Suspense Demo</h2>
            <SuspenseDemo />
          </div>

          <div className="demo-section">
            <h2>📄 Keep Previous Data (Pagination)</h2>
            <KeepPreviousDataDemo />
          </div>

          <div className="demo-section">
            <h2>🔄 Refetch on Focus / Reconnect</h2>
            <FocusReconnectDemo />
          </div>

          <div className="demo-section">
            <h2>♾️ Infinite Query Demo</h2>
            <InfiniteQueryDemo />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App