# MFestack Query

A next-generation data-fetching and caching library inspired by TanStack Query, designed for enterprise, micro-frontend, and multi-framework applications.

## 🚀 Features

- **Framework Agnostic Core** - Works with React, Vue, Angular, Svelte, Solid, and more
- **Plugin-First Architecture** - Extensible through a powerful plugin system
- **Multi-App Synchronization** - Share cache between tabs and micro-frontends
- **Enterprise Ready** - Built for large-scale applications
- **TypeScript First** - Full type safety and excellent developer experience
- **SSR Support** - Complete hydration and dehydration pipeline
- **Performance Optimized** - Structural sharing and intelligent caching

## 📦 Installation

```bash
# Core package
npm install @mfestack/core

# React adapter
npm install @mfestack/react
```

## 🎯 Quick Start

```tsx
import { QueryClient, QueryClientProvider, useQuery } from '@mfestack/react'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Posts />
    </QueryClientProvider>
  )
}

function Posts() {
  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(res => res.json())
  })

  if (isLoading) return <div>Loading...</div>
  return <ul>{data?.map(post => <li key={post.id}>{post.title}</li>)}</ul>
}
```

## 📚 Documentation

- [Quick Start Guide](/guide/quickstart)
- [API Reference](/api/query-client)
- [Recipes](/recipes/pagination)
- [Migration from TanStack Query](/migration/)

