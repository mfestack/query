import { describe, expect, test } from 'vitest'
import { QueryClient } from '../client/QueryClient'

describe('Hydration', () => {
  test('dehydrate and hydrate roundtrip preserves data', () => {
    const clientA = new QueryClient()
    clientA.setQueryData(['user', 1], { id: 1, name: 'Alice' })

    const state = clientA.dehydrate()

    const clientB = new QueryClient()
    clientB.hydrate(state)

    const data = clientB.getQueryData<{ id: number; name: string }>(['user', 1])
    expect(data?.name).toBe('Alice')
  })
})


