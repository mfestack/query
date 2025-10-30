import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderWithQueryClient } from './testUtils'
import { useQuery, useMutation, useQueryClient } from '../hooks'

// Mock functions
const mockFetchUser = vi.fn()
const mockUpdateUser = vi.fn()

// Integration test component
function UserProfile({ userId }: { userId: number }) {
  const queryClient = useQueryClient()
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => mockFetchUser(userId),
  })

  const updateUserMutation = useMutation({
    mutationFn: (userData: any) => mockUpdateUser(userId, userData),
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
    },
  })

  const handleUpdate = () => {
    updateUserMutation.mutate({ name: 'Updated Name' })
  }

  if (isLoading) return <div>Loading user...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>User Profile</h1>
      <div data-testid="user-name">{user?.name || 'No name'}</div>
      <div data-testid="user-email">{user?.email || 'No email'}</div>
      <button 
        onClick={handleUpdate} 
        disabled={updateUserMutation.isLoading}
        data-testid="update-button"
      >
        {updateUserMutation.isLoading ? 'Updating...' : 'Update User'}
      </button>
      {updateUserMutation.error && (
        <div data-testid="mutation-error">Update failed: {updateUserMutation.error.message}</div>
      )}
    </div>
  )
}

describe('React Adapter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should handle complete query and mutation flow', async () => {
    const userId = 1
    const userData = { id: userId, name: 'John Doe', email: 'john@example.com' }
    const updatedUserData = { id: userId, name: 'Updated Name', email: 'john@example.com' }

    mockFetchUser.mockResolvedValueOnce(userData)
    mockUpdateUser.mockResolvedValueOnce(updatedUserData)

    renderWithQueryClient(<UserProfile userId={userId} />)

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe')
    })

    expect(screen.getByTestId('user-email')).toHaveTextContent('john@example.com')
    expect(mockFetchUser).toHaveBeenCalledWith(userId)

    // Trigger update mutation
    const updateButton = screen.getByTestId('update-button')
    fireEvent.click(updateButton)

    // Should show loading state
    expect(updateButton).toHaveTextContent('Updating...')

    // Wait for mutation to complete
    await waitFor(() => {
      expect(updateButton).toHaveTextContent('Update User')
    })

    expect(mockUpdateUser).toHaveBeenCalledWith(userId, { name: 'Updated Name' })
    expect(screen.queryByTestId('mutation-error')).not.toBeInTheDocument()
  })

  test('should handle mutation error gracefully', async () => {
    const userId = 1
    const userData = { id: userId, name: 'John Doe', email: 'john@example.com' }
    const errorMessage = 'Update failed'

    mockFetchUser.mockResolvedValueOnce(userData)
    mockUpdateUser.mockRejectedValueOnce(new Error(errorMessage))

    renderWithQueryClient(<UserProfile userId={userId} />)

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe')
    })

    // Trigger update mutation
    const updateButton = screen.getByTestId('update-button')
    fireEvent.click(updateButton)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('mutation-error')).toHaveTextContent(`Update failed: ${errorMessage}`)
    })

    expect(updateButton).toHaveTextContent('Update User')
  })

  test('should handle query error', async () => {
    const userId = 1
    const errorMessage = 'User not found'

    mockFetchUser.mockRejectedValueOnce(new Error(errorMessage))

    renderWithQueryClient(<UserProfile userId={userId} />)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument()
    })

    expect(screen.queryByTestId('user-name')).not.toBeInTheDocument()
  })

  test('should work with multiple instances', async () => {
    const user1Data = { id: 1, name: 'User 1', email: 'user1@example.com' }
    const user2Data = { id: 2, name: 'User 2', email: 'user2@example.com' }

    mockFetchUser
      .mockResolvedValueOnce(user1Data)
      .mockResolvedValueOnce(user2Data)

    renderWithQueryClient(
      <div>
        <UserProfile userId={1} />
        <UserProfile userId={2} />
      </div>
    )

    // Wait for both users to load
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument()
      expect(screen.getByText('User 2')).toBeInTheDocument()
    })

    expect(mockFetchUser).toHaveBeenCalledTimes(2)
    expect(mockFetchUser).toHaveBeenCalledWith(1)
    expect(mockFetchUser).toHaveBeenCalledWith(2)
  })
})
