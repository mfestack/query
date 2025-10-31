import { describe, expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { createQueryClient } from '@mfestack/core'
import { QueryClientProvider } from '@mfestack/react'
import { AppStackDevtools } from '../components/AppStackDevtools'

describe('AppStackDevtools', () => {
  test('should render without errors', () => {
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <AppStackDevtools />
      </QueryClientProvider>
    )
    
    // If we get here without throwing, the component rendered successfully
    expect(true).toBe(true)
  })

  test('should render with custom client', () => {
    const customClient = createQueryClient()
    
    render(
      <QueryClientProvider client={customClient}>
        <AppStackDevtools client={customClient} />
      </QueryClientProvider>
    )
    
    // If we get here without throwing, the component rendered successfully
    expect(true).toBe(true)
  })

  test('should render with initialIsOpen=true', () => {
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <AppStackDevtools initialIsOpen={true} />
      </QueryClientProvider>
    )
    
    // If we get here without throwing, the component rendered successfully
    expect(true).toBe(true)
  })
})

