import React from 'react'
import { render, screen } from '@testing-library/react'
import { createQueryClient } from '@mfestack/core'
import { renderWithQueryClient } from './testUtils'
import { useQueryClient } from '../hooks/useQueryClient'
import { describe, test, expect, vi } from 'vitest'

// Test component that uses useQueryClient
function TestComponent() {
  const client = useQueryClient()
  
  return (
    <div>
      <div data-testid="client-type">{client.constructor.name}</div>
      <div data-testid="client-methods">
        {typeof client.getQueryCache === 'function' ? 'Has getQueryCache' : 'No getQueryCache'}
      </div>
      <div data-testid="client-methods-2">
        {typeof client.setQueryData === 'function' ? 'Has setQueryData' : 'No setQueryData'}
      </div>
    </div>
  )
}

describe('useQueryClient', () => {
  test('should return QueryClient instance when used within provider', () => {
    const queryClient = createQueryClient()
    
    renderWithQueryClient(<TestComponent />, { queryClient })

    expect(screen.getByTestId('client-type')).toHaveTextContent('QueryClient')
    expect(screen.getByTestId('client-methods')).toHaveTextContent('Has getQueryCache')
    expect(screen.getByTestId('client-methods-2')).toHaveTextContent('Has setQueryData')
  })

  test('should return the same client instance across re-renders', () => {
    const queryClient = createQueryClient()
    let clientRef: any = null

    function TestComponentWithRef() {
      const client = useQueryClient()
      clientRef = client
      return <div data-testid="client-ref">{client === clientRef ? 'Same' : 'Different'}</div>
    }

    const { rerender } = renderWithQueryClient(
      <TestComponentWithRef />,
      { queryClient }
    )

    expect(screen.getByTestId('client-ref')).toHaveTextContent('Same')

    // Rerender
    rerender(<TestComponentWithRef />)

    expect(screen.getByTestId('client-ref')).toHaveTextContent('Same')
  })

  test('should work with multiple components using the same client', () => {
    const queryClient = createQueryClient()
    
    function Component1() {
      const client = useQueryClient()
      return <div data-testid="client-1">{client.constructor.name}</div>
    }

    function Component2() {
      const client = useQueryClient()
      return <div data-testid="client-2">{client.constructor.name}</div>
    }

    renderWithQueryClient(
      <div>
        <Component1 />
        <Component2 />
      </div>,
      { queryClient }
    )

    expect(screen.getByTestId('client-1')).toHaveTextContent('QueryClient')
    expect(screen.getByTestId('client-2')).toHaveTextContent('QueryClient')
  })

  test('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useQueryClient must be used within a QueryClientProvider')

    consoleSpy.mockRestore()
  })
})
