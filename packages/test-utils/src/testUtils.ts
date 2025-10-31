// Test utilities
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function mockFetch<T = any>(data: T, delay = 0) {
  const fn = () =>
    new Promise<{ json: () => Promise<T> }>(resolve =>
      setTimeout(() => resolve({ json: () => Promise.resolve(data) }), delay)
    )
  return fn
}
