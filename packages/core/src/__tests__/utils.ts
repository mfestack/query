// Test utilities for AppStack Query

export const queryKey = (key?: string | string[]) => {
  if (key) {
    return Array.isArray(key) ? key : [key]
  }
  return [`test-${Math.random()}`]
}

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const mockOnlineManagerIsOnline = (isOnline: boolean) => {
  // Mock online manager for testing
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: isOnline,
  })
}

export const mockFocusManagerIsFocused = (isFocused: boolean) => {
  // Mock focus manager for testing
  Object.defineProperty(document, 'hasFocus', {
    writable: true,
    value: () => isFocused,
  })
}
