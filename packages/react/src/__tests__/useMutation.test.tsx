import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithQueryClient } from './testUtils'
import { useMutation } from '../hooks/useMutation'

// Mock mutation function
const mockMutationFn = vi.fn()

// Test component that uses useMutation
function TestComponent({ mutationFn, onSuccess, onError }: {
  mutationFn: (variables: any) => Promise<any>
  onSuccess?: (data: any, variables: any) => void
  onError?: (error: any, variables: any) => void
}) {
  const { mutate, data, error, isLoading } = useMutation({
    mutationFn,
    onSuccess,
    onError,
  })

  const handleMutate = () => {
    // Swallow errors to avoid unhandled rejections during tests
    mutate({ id: 1, name: 'Test' }).catch(() => {})
  }

  return (
    <div>
      <button onClick={handleMutate} data-testid="mutate-button">
        {isLoading ? 'Mutating...' : 'Mutate'}
      </button>
      <div data-testid="data">{data ? JSON.stringify(data) : 'No data'}</div>
      <div data-testid="error">{error ? error.message : 'No error'}</div>
    </div>
  )
}

describe('useMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should handle successful mutation', async () => {
    const testData = { id: 1, name: 'Created' }
    mockMutationFn.mockResolvedValueOnce(testData)

    renderWithQueryClient(
      <TestComponent mutationFn={mockMutationFn} />
    )

    const button = screen.getByTestId('mutate-button')
    expect(button).toHaveTextContent('Mutate')
    expect(screen.getByTestId('data')).toHaveTextContent('No data')
    expect(screen.getByTestId('error')).toHaveTextContent('No error')

    // Trigger mutation
    fireEvent.click(button)

    // Should show loading state
    expect(button).toHaveTextContent('Mutating...')

    // Wait for mutation to complete
    await waitFor(() => {
      expect(button).toHaveTextContent('Mutate')
    })

    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData))
    expect(screen.getByTestId('error')).toHaveTextContent('No error')
    expect(mockMutationFn).toHaveBeenCalledWith({ id: 1, name: 'Test' })
  })

  test('should handle mutation error', async () => {
    const errorMessage = 'Mutation failed'
    mockMutationFn.mockRejectedValueOnce(new Error(errorMessage))

    renderWithQueryClient(
      <TestComponent mutationFn={mockMutationFn} />
    )

    const button = screen.getByTestId('mutate-button')
    
    // Trigger mutation and catch the error
    fireEvent.click(button)

    // Wait for error to occur
    await waitFor(() => {
      expect(button).toHaveTextContent('Mutate')
    })

    expect(screen.getByTestId('data')).toHaveTextContent('No data')
    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
    expect(mockMutationFn).toHaveBeenCalledWith({ id: 1, name: 'Test' })
  })

  test('should call onSuccess callback', async () => {
    const testData = { id: 1, name: 'Created' }
    const onSuccess = vi.fn()
    mockMutationFn.mockResolvedValueOnce(testData)

    renderWithQueryClient(
      <TestComponent mutationFn={mockMutationFn} onSuccess={onSuccess} />
    )

    const button = screen.getByTestId('mutate-button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(testData, { id: 1, name: 'Test' }, undefined)
    })
  })

  test('should call onError callback', async () => {
    const errorMessage = 'Mutation failed'
    const onError = vi.fn()
    mockMutationFn.mockRejectedValueOnce(new Error(errorMessage))

    renderWithQueryClient(
      <TestComponent mutationFn={mockMutationFn} onError={onError} />
    )

    const button = screen.getByTestId('mutate-button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: errorMessage }),
        { id: 1, name: 'Test' },
        undefined
      )
    })
  })

  test('should handle multiple mutations', async () => {
    const testData1 = { id: 1, name: 'First' }
    const testData2 = { id: 2, name: 'Second' }
    
    mockMutationFn
      .mockResolvedValueOnce(testData1)
      .mockResolvedValueOnce(testData2)

    renderWithQueryClient(
      <TestComponent mutationFn={mockMutationFn} />
    )

    const button = screen.getByTestId('mutate-button')
    
    // First mutation
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData1))
    })

    // Second mutation
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData2))
    })

    expect(mockMutationFn).toHaveBeenCalledTimes(2)
  })

  test('should reset state between mutations', async () => {
    const testData = { id: 1, name: 'Created' }
    const errorMessage = 'Mutation failed'
    
    mockMutationFn
      .mockResolvedValueOnce(testData)
      .mockRejectedValueOnce(new Error(errorMessage))

    renderWithQueryClient(
      <TestComponent mutationFn={mockMutationFn} />
    )

    const button = screen.getByTestId('mutate-button')
    
    // First mutation (success)
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData))
    })

    // Second mutation (error)
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
    })

    // Data should still be from first mutation
    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData))
  })
})
