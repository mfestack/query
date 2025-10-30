import React from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createQueryClient } from '@mfestack/core'
import { QueryClientProvider, useQueryClient } from '../context/QueryClientProvider'

function TestComponent() {
  const client = useQueryClient()
  return <div data-testid="client">{client ? 'Client available' : 'No client'}</div>
}

describe('QueryClientProvider', () => {
  test('should provide QueryClient to children', () => {
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    )

    expect(screen.getByTestId('client')).toHaveTextContent('Client available')
  })

  test('should throw error when useQueryClient is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useQueryClient must be used within a QueryClientProvider')

    consoleSpy.mockRestore()
  })

  test('should work with multiple children', () => {
    const queryClient = createQueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <div>Child 1</div>
        <div>Child 2</div>
        <TestComponent />
      </QueryClientProvider>
    )

    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByTestId('client')).toHaveTextContent('Client available')
  })
})

