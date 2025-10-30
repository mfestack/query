import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, createQueryClient } from '@mfestack/core'
import { QueryClientProvider } from '../context/QueryClientProvider'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

export function renderWithQueryClient(
  ui: React.ReactElement,
  { queryClient = createQueryClient(), ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

export * from '@testing-library/react'
export { renderWithQueryClient as render }
