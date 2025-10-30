import { QueryClient } from '@mfestack/core'
import { QueryClientProvider } from '@mfestack/react'
import { QueryDemo } from './components/QueryDemo'
import { MutationDemo } from './components/MutationDemo'
import { CacheDemo } from './components/CacheDemo'
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
        </main>
      </div>
    </QueryClientProvider>
  )
}

export default App