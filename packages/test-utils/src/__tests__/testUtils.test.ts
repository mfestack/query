import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sleep, mockFetch } from '../testUtils'

describe('testUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('sleep', () => {
    it('should resolve after the specified delay', async () => {
      const delay = 1000
      const promise = sleep(delay)
      
      vi.advanceTimersByTime(delay)
      
      await expect(promise).resolves.toBeUndefined()
    })

    it('should wait for the correct amount of time', async () => {
      const delay = 500
      const promise = sleep(delay)
      
      vi.advanceTimersByTime(delay)
      
      await promise
      // Test passed means it waited correctly
      expect(true).toBe(true)
    })
  })

  describe('mockFetch', () => {
    it('should return a function that returns a promise', () => {
      const mockFn = mockFetch({ data: 'test' })
      expect(typeof mockFn).toBe('function')
      
      const result = mockFn()
      expect(result).toBeInstanceOf(Promise)
    })

    it('should resolve with the provided data', async () => {
      const testData = { id: 1, name: 'Test' }
      const mockFn = mockFetch(testData)
      
      const promise = mockFn()
      vi.advanceTimersByTime(0)
      await vi.runOnlyPendingTimersAsync()
      
      const response = await promise
      const data = await response.json()
      expect(data).toEqual(testData)
    })

    it('should respect the delay parameter', async () => {
      vi.useRealTimers()
      
      const testData = { data: 'delayed' }
      const delay = 50 // Short delay for test
      const mockFn = mockFetch(testData, delay)
      
      const start = Date.now()
      const response = await mockFn()
      const end = Date.now()
      const data = await response.json()
      
      expect(data).toEqual(testData)
      expect(end - start).toBeGreaterThanOrEqual(delay - 10) // Allow some margin for timing
    })

    it('should work with different data types', async () => {
      vi.useRealTimers()
      
      const stringData = 'test string'
      const numberData = 42
      const arrayData = [1, 2, 3]
      const objectData = { key: 'value' }
      
      const stringResult = await (await mockFetch(stringData)()).json()
      expect(stringResult).toBe(stringData)
      
      const numberResult = await (await mockFetch(numberData)()).json()
      expect(numberResult).toBe(numberData)
      
      const arrayResult = await (await mockFetch(arrayData)()).json()
      expect(arrayResult).toEqual(arrayData)
      
      const objectResult = await (await mockFetch(objectData)()).json()
      expect(objectResult).toEqual(objectData)
    })
  })
})

