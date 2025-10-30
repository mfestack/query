import { describe, expect, test, vi } from 'vitest'
import { QueryClient } from '../client/QueryClient'

describe('Refetch policies: focus and online', () => {
  test('refetches on window focus when enabled', async () => {
    const client = new QueryClient()
    const queryFn = vi.fn().mockResolvedValue('data')

    // create query
    const q1 = client.getQueryCache().build(client, {
      queryKey: ['focus'],
      queryFn,
      refetchOnWindowFocus: true,
    })
    ;(q1 as any).observers.push({})

    // dispatch focus event to window
    window.dispatchEvent(new Event('focus'))

    // allow microtasks
    await Promise.resolve()
    expect(queryFn).toHaveBeenCalled()
  })

  test('refetches on online when enabled', async () => {
    const client = new QueryClient()
    const queryFn = vi.fn().mockResolvedValue('data')

    const q2 = client.getQueryCache().build(client, {
      queryKey: ['online'],
      queryFn,
      refetchOnReconnect: true,
    })
    ;(q2 as any).observers.push({})

    // dispatch online event
    window.dispatchEvent(new Event('online'))

    await Promise.resolve()
    expect(queryFn).toHaveBeenCalled()
  })
})


