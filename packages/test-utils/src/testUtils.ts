// Test utilities
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function mockFetch(data: any, delay = 0) {
  return jest.fn(() => 
    new Promise(resolve => 
      setTimeout(() => resolve({ json: () => Promise.resolve(data) }), delay)
    )
  )
}
