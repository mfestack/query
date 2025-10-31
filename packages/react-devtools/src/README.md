# React DevTools

React-specific DevTools implementation for AppStack Query, located within the `@mfestack/react` package.

## Usage

```tsx
import { QueryClientProvider, AppStackDevtools } from '@mfestack/react'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
      <AppStackDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

## Structure

- `components/` - React UI components (panels, buttons, etc.)
- `hooks/` - React hooks (`useDevTools`)
- Uses `@mfestack/devtools-core` for the engine logic

## Architecture

The DevTools are organized as:
- `@mfestack/devtools-core` - Framework-agnostic engine
- `@mfestack/react` (this package) - React UI implementation

This allows for future Vue/Angular implementations while sharing the core engine.

