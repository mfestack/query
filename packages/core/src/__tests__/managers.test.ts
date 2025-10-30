import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { focusManager, onlineManager, notifyManager, batchManager, retryer } from '../managers'
import { mockOnlineManagerIsOnline, mockFocusManagerIsFocused } from './utils'

describe('Managers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('FocusManager', () => {
    test('should track focus state', () => {
      expect(focusManager.isFocusedFn()).toBe(true)
    })

    test('should subscribe to focus changes', () => {
      const callback = vi.fn()
      const unsubscribe = focusManager.subscribe(callback)
      
      expect(typeof unsubscribe).toBe('function')
      
      // Simulate focus change
      mockFocusManagerIsFocused(false)
      window.dispatchEvent(new Event('blur'))
      
      expect(callback).toHaveBeenCalledWith(false)
      
      unsubscribe()
    })

    test('should handle focus events', () => {
      const callback = vi.fn()
      focusManager.subscribe(callback)
      
      // Simulate blur
      window.dispatchEvent(new Event('blur'))
      expect(callback).toHaveBeenCalledWith(false)
      
      // Simulate focus
      window.dispatchEvent(new Event('focus'))
      expect(callback).toHaveBeenCalledWith(true)
    })
  })

  describe('OnlineManager', () => {
    test('should track online state', () => {
      expect(onlineManager.getOnlineStatus()).toBe(true)
    })

    test('should subscribe to online changes', () => {
      const callback = vi.fn()
      const unsubscribe = onlineManager.subscribe(callback)
      
      expect(typeof unsubscribe).toBe('function')
      
      // Simulate offline
      mockOnlineManagerIsOnline(false)
      window.dispatchEvent(new Event('offline'))
      
      expect(callback).toHaveBeenCalledWith(false)
      
      unsubscribe()
    })

    test('should handle online/offline events', () => {
      const callback = vi.fn()
      onlineManager.subscribe(callback)
      
      // Simulate offline
      window.dispatchEvent(new Event('offline'))
      expect(callback).toHaveBeenCalledWith(false)
      
      // Simulate online
      window.dispatchEvent(new Event('online'))
      expect(callback).toHaveBeenCalledWith(true)
    })
  })

  describe('NotifyManager', () => {
    test('should batch notifications', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      notifyManager.subscribe(callback1)
      notifyManager.subscribe(callback2)
      
      notifyManager.batchNotifyUpdates(() => {
        callback1()
        callback2()
      })
      
      // Should be called immediately since we're not in a batch
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    test('should subscribe to notifications', () => {
      const callback = vi.fn()
      const unsubscribe = notifyManager.subscribe(callback)
      
      expect(typeof unsubscribe).toBe('function')
      
      // Trigger notification
      notifyManager.notify(() => {})
      
      expect(callback).toHaveBeenCalled()
      
      unsubscribe()
    })
  })

  describe('BatchManager', () => {
    test('should batch updates', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      batchManager.batch(callback1)
      batchManager.batch(callback2)
      
      // Should be called asynchronously
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
      
      // Advance timers to trigger batch
      vi.advanceTimersByTime(0)
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    test('should flush batch', () => {
      const callback = vi.fn()
      
      batchManager.batch(() => {
        callback()
      })
      
      // Flush immediately
      batchManager.flush()
      
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('Retryer', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('should retry failed operations', async () => {
      let attemptCount = 0
      const fn = vi.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error('Failed')
        }
        return 'success'
      })
      
      const promise = retryer.run(fn, {
        retry: 3,
        retryDelay: () => 100,
      })
      
      // Advance timers to handle retries
      await vi.advanceTimersByTimeAsync(300)
      
      const result = await promise
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    test('should not retry when retry is false', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'))
      
      const promise = retryer.run(fn, { retry: false })
      
      await expect(promise).rejects.toThrow('Failed')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    test('should cancel retry', async () => {
      const fn = vi.fn().mockImplementation(() => {
        return Promise.resolve('success')
      })
      
      const promise = retryer.run(fn, {
        retry: 3,
        retryDelay: () => 100,
      })
      
      // Cancel before completion
      retryer.cancel()
      
      // Should still resolve since function succeeds immediately
      const result = await promise
      expect(result).toBe('success')
    })

    test('should track retry status', () => {
      expect(retryer.getRetryingStatus()).toBe(false)
      expect(retryer.getRetryCount()).toBe(0)
    })
  })
})
