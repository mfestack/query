import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithQueryClient } from './testUtils'
import { useQuery } from '../hooks/useQuery'

// Mock fetch function
const mockFetch = vi.fn()

// Test component that uses useQuery
function TestComponent({ queryKey, queryFn }: { queryKey: any[], queryFn: () => Promise<any> }) {
  const { data, isLoading, error, isSuccess } = useQuery({
    queryKey,
    queryFn,
  })

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="data">{data ? JSON.stringify(data) : 'No data'}</div>
      <div data-testid="error">{error ? error.message : 'No error'}</div>
      <div data-testid="success">{isSuccess ? 'Success' : 'Not success'}</div>
    </div>
  )
}

describe('useQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should handle successful query', async () => {
    const queryKey = ['test-success']
    const testData = { message: 'Hello World' }
    
    mockFetch.mockResolvedValueOnce(testData)

    renderWithQueryClient(
      <TestComponent queryKey={queryKey} queryFn={mockFetch} />
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData))
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
    expect(screen.getByTestId('error')).toHaveTextContent('No error')
    expect(screen.getByTestId('success')).toHaveTextContent('Success')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  test('should handle query error', async () => {
    const queryKey = ['test-error']
    const errorMessage = 'Network error'
    
    mockFetch.mockRejectedValueOnce(new Error(errorMessage))

    renderWithQueryClient(
      <TestComponent queryKey={queryKey} queryFn={mockFetch} />
    )

    // Wait for error to occur
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
    })

    expect(screen.getByTestId('data')).toHaveTextContent('No data')
    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
    expect(screen.getByTestId('success')).toHaveTextContent('Not success')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  test('should use cached data on subsequent renders', async () => {
    const queryKey = ['test-cache']
    const testData = { message: 'Cached data' }
    
    mockFetch.mockResolvedValueOnce(testData)

    const { rerender } = renderWithQueryClient(
      <TestComponent queryKey={queryKey} queryFn={mockFetch} />
    )

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData))
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Rerender with same queryKey
    rerender(<TestComponent queryKey={queryKey} queryFn={mockFetch} />)

    // Should still show data but not call queryFn again
    expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  test('should refetch when queryKey changes', async () => {
    const queryKey1 = ['test-1']
    const queryKey2 = ['test-2']
    const testData1 = { message: 'Data 1' }
    const testData2 = { message: 'Data 2' }
    
    mockFetch
      .mockResolvedValueOnce(testData1)
      .mockResolvedValueOnce(testData2)

    const { rerender } = renderWithQueryClient(
      <TestComponent queryKey={queryKey1} queryFn={mockFetch} />
    )

    // Wait for first data to load
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData1))
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Change queryKey
    rerender(<TestComponent queryKey={queryKey2} queryFn={mockFetch} />)

    // Wait for second data to load
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData2))
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  test('should handle queryFn that receives context', async () => {
    const queryKey = ['test-context']
    const testData = { message: 'Context data' }
    
    const queryFn = vi.fn().mockResolvedValue(testData)

    renderWithQueryClient(
      <TestComponent queryKey={queryKey} queryFn={queryFn} />
    )

    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent(JSON.stringify(testData))
    })

    expect(queryFn).toHaveBeenCalledWith({
      queryKey,
      signal: expect.any(AbortSignal),
    })
  })
})
