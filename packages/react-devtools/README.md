# @mfestack/react-devtools

React DevTools for AppStack Query. This package provides an interactive debugging panel for inspecting queries, mutations, cache state, and events.

## Installation

```bash
pnpm add @mfestack/react-devtools @mfestack/react @mfestack/core
```

## Usage

```tsx
import { QueryClient, QueryClientProvider } from '@mfestack/react'
import { AppStackDevtools } from '@mfestack/react-devtools'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
      <AppStackDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

## Props

- `client?: QueryClient` - Custom QueryClient instance (uses context if not provided)
- `initialIsOpen?: boolean` - Default to open (default: `false`)
- `position?: 'top' | 'bottom' | 'left' | 'right'` - Panel position (default: `'bottom'`)
- `buttonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'` - Toggle button position (default: `'bottom-right'`)
- `hideDisabledQueries?: boolean` - Hide disabled queries from panel

## Features

### Queries Panel
- View all active queries with status, timestamps, and metadata
- Actions: Refetch, Invalidate, Remove
- Real-time updates via EventBus

### Mutations Panel
- Monitor mutation lifecycle and status
- View errors and pending states

### Cache Panel
- Statistics (total queries, active queries, errors, mutations)
- Clear cache action

### Events Panel
- Real-time EventBus event timeline
- Color-coded event types
- Expandable payload details

## Architecture

This package uses:
- `@mfestack/devtools-core` - Framework-agnostic engine for state management and EventBus subscriptions
- `@mfestack/react` - For `useQueryClient` hook
- React components for the UI

This separation allows for:
- Future Vue/Angular DevTools implementations
- Tree-shaking (DevTools excluded if not used)
- Smaller core bundle size

## Production

DevTools automatically exclude themselves in production builds (`process.env.NODE_ENV !== 'development'`), so you can safely include them in your code without affecting production bundle size.

