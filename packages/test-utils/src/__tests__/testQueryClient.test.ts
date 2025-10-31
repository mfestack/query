import { describe, it, expect, beforeEach } from 'vitest'
import { createTestQueryClient } from '../testQueryClient'
import type { QueryClient } from '@mfestack/core'

describe('testQueryClient', () => {
  let client: QueryClient

  beforeEach(() => {
    client = createTestQueryClient()
  })

  it('should create a QueryClient instance', () => {
    expect(client).toBeDefined()
    expect(client.queryCache).toBeDefined()
    expect(client.mutationCache).toBeDefined()
  })

  it('should have retry disabled for queries', () => {
    const defaultOptions = client.getDefaultOptions()
    expect(defaultOptions.queries?.retry).toBe(false)
  })

  it('should have gcTime set to 0 for queries', () => {
    const defaultOptions = client.getDefaultOptions()
    expect(defaultOptions.queries?.gcTime).toBe(0)
  })

  it('should have retry disabled for mutations', () => {
    const defaultOptions = client.getDefaultOptions()
    expect(defaultOptions.mutations?.retry).toBe(false)
  })

  it('should allow setting query data', () => {
    client.setQueryData(['test'], { id: 1 })
    const data = client.getQueryData(['test'])
    expect(data).toEqual({ id: 1 })
  })

  it('should allow invalidating queries', async () => {
    client.setQueryData(['test'], { id: 1 })
    await client.invalidateQueries({ queryKey: ['test'] })
    // Query should be marked as invalid but data should still be available
    const data = client.getQueryData(['test'])
    expect(data).toEqual({ id: 1 })
  })

  it('should create independent instances', () => {
    const client1 = createTestQueryClient()
    const client2 = createTestQueryClient()
    
    expect(client1).not.toBe(client2)
    
    client1.setQueryData(['test'], { data: 'client1' })
    client2.setQueryData(['test'], { data: 'client2' })
    
    expect(client1.getQueryData(['test'])).toEqual({ data: 'client1' })
    expect(client2.getQueryData(['test'])).toEqual({ data: 'client2' })
  })

  it('should clear cache correctly', () => {
    client.setQueryData(['test1'], { id: 1 })
    client.setQueryData(['test2'], { id: 2 })
    
    expect(client.getQueryData(['test1'])).toBeDefined()
    expect(client.getQueryData(['test2'])).toBeDefined()
    
    client.clear()
    
    expect(client.getQueryData(['test1'])).toBeUndefined()
    expect(client.getQueryData(['test2'])).toBeUndefined()
  })
})

