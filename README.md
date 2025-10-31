# MFEStack Query

[![npm version](https://img.shields.io/npm/v/@mfestack/core.svg)](https://www.npmjs.com/package/@mfestack/core)
[![CI](https://github.com/mfestack/query/actions/workflows/test.yml/badge.svg)](https://github.com/mfestack/query/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A next-generation data-fetching and caching library inspired by TanStack Query, designed for enterprise, micro-frontend, and multi-framework applications.

## 🚀 Features

- **Framework Agnostic Core** - Works with React, Vue, Angular, Svelte, Solid, and more
- **Plugin-First Architecture** - Extensible through a powerful plugin system
- **Multi-App Synchronization** - Share cache between tabs and micro-frontends
- **Enterprise Ready** - Built for large-scale applications
- **TypeScript First** - Full type safety and excellent developer experience
- **SSR Support** - Complete hydration and dehydration pipeline
- **Performance Optimized** - Structural sharing and intelligent caching

## 📦 Packages

| Package | Description |
|---------|-------------|
| `@mfestack/core` | Framework-agnostic core engine |
| `@mfestack/react` | React hooks and components |
| `@mfestack/vue` | Vue composables and components |
| `@mfestack/angular` | Angular services and directives |
| `@mfestack/svelte` | Svelte stores and components |
| `@mfestack/solid` | Solid primitives and components |
| `@mfestack/devtools` | Development tools and debugging |
| `@mfestack/persist-client` | Persistence plugins |
| `@mfestack/broadcast-client` | Multi-tab synchronization |

## 🏗️ Architecture

MFEStack Query follows a layered architecture:

```
┌──────────────────────────────┐
│       QueryClient Layer      │  ← Entry point / public API
├──────────────────────────────┤
│      Query & Mutation Layer  │  ← State machine for async data
├──────────────────────────────┤
│      Cache & Manager Layer   │  ← Lifecycle & synchronization
├──────────────────────────────┤
│   Hydration & Plugin System  │  ← SSR, persistence, cross-app sync
├──────────────────────────────┤
│            Utils Layer       │  ← Shared utilities & abstractions
└──────────────────────────────┘
```

## 🚀 Quick Start

### Installation

```bash
# Core package
npm install @mfestack/core

# React adapter
npm install @mfestack/react

# Vue adapter
npm install @mfestack/vue

# Or install all at once
npm install @mfestack/core @mfestack/react @mfestack/vue
```

### Basic Usage

#### React

```tsx
import { QueryClient, QueryClientProvider, useQuery } from '@mfestack/react'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  )
}

function Todos() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(res => res.json())
  })

  if (isLoading) return 'Loading...'
  if (error) return 'An error occurred'

  return (
    <ul>
      {data?.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

#### Vue

```vue
<script setup>
import { useQuery } from '@mfestack/vue'

const { data, isLoading, error } = useQuery({
  queryKey: ['todos'],
  queryFn: () => fetch('/api/todos').then(res => res.json())
})
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">An error occurred</div>
  <ul v-else>
    <li v-for="todo in data" :key="todo.id">
      {{ todo.title }}
    </li>
  </ul>
</template>
```

## 🔌 Plugin System

MFEStack Query features a powerful plugin system:

```typescript
import { QueryClient, persistPlugin, broadcastPlugin } from '@mfestack/core'

const queryClient = new QueryClient({
  plugins: [
    persistPlugin({ storage: localStorage }),
    broadcastPlugin({ channel: 'mfestack-sync' }),
  ]
})
```

## 🌐 Multi-App Synchronization

Share cache between multiple applications:

```typescript
// App A
const queryClient = new QueryClient({
  plugins: [
    broadcastPlugin({ channel: 'my-app' })
  ]
})

// App B - automatically receives updates from App A
const queryClient = new QueryClient({
  plugins: [
    broadcastPlugin({ channel: 'my-app' })
  ]
})
```

## 📚 Documentation

- [Core Concepts](./docs/1.%20AppStack%20Query%20Core%20Architecture%20Overview.md)
- [Internal Architecture](./docs/2.%20Internal%20Architecture%20&%20Module%20Responsibilities.md)
- [Lifecycle Flow](./docs/3.%20Lifecycle%20Flow.md)
- [Adapter Integration](./docs/4.%20Adapter%20Integration%20&%20Framework%20Layer.md)
- [Plugin System](./docs/5.%20Plugin%20System%20&%20Extensibility%20Layer.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

MFEStack Query is inspired by [TanStack Query](https://tanstack.com/query) and builds upon its excellent foundation while adding enterprise-focused features and multi-framework support.
