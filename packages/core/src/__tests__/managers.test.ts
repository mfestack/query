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

    test('should use microtask strategy by default', async () => {
      const { NotifyManager } = await import('../managers/NotifyManager')
      const manager = new NotifyManager({ flushStrategy: 'microtask' })
      const callback = vi.fn()

      manager.batchNotifyUpdates(callback)

      expect(callback).not.toHaveBeenCalled()

      // Microtask should flush on next tick
      return Promise.resolve().then(() => {
        expect(callback).toHaveBeenCalled()
        manager.dispose()
      })
    })

    test('should use RAF strategy when configured', async () => {
      const { NotifyManager } = await import('../managers/NotifyManager')
      const manager = new NotifyManager({ flushStrategy: 'raf' })
      const callback = vi.fn()

      manager.batchNotifyUpdates(callback)

      expect(callback).not.toHaveBeenCalled()

      // Simulate RAF
      if (typeof requestAnimationFrame !== 'undefined') {
        vi.advanceTimersByTime(16)
      } else {
        // Fallback to microtask
        return Promise.resolve().then(() => {
          expect(callback).toHaveBeenCalled()
          manager.dispose()
        })
      }

      expect(callback).toHaveBeenCalled()
      manager.dispose()
    })

    test('should limit queue size to prevent memory issues', async () => {
      const { NotifyManager } = await import('../managers/NotifyManager')
      const manager = new NotifyManager({ maxBatchSize: 5 })
      const callbacks = Array.from({ length: 10 }, () => vi.fn())

      // Add more than maxBatchSize
      callbacks.forEach((callback) => {
        manager.batchNotifyUpdates(callback)
      })

      // Should flush when max size is reached - wait for microtask
      await Promise.resolve()
      expect(callbacks[0]).toHaveBeenCalled()
      manager.dispose()
    })

    test('should notify listeners immediately on notify', () => {
      const listener = vi.fn()
      notifyManager.subscribe(listener)

      const callback = vi.fn()
      notifyManager.notify(callback)

      // Listener should be called immediately
      expect(listener).toHaveBeenCalled()
      // Callback should also be called (not batched when not in batch mode)
      expect(callback).toHaveBeenCalled()

      notifyManager.dispose()
    })

    test('should handle errors in batched notifications', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const callback1 = vi.fn()
      const callback2 = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      const callback3 = vi.fn()

      notifyManager.batchNotifyUpdates(callback1)
      notifyManager.batchNotifyUpdates(callback2)
      notifyManager.batchNotifyUpdates(callback3)

      notifyManager.flush()

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(callback3).toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })

    test('should unsubscribe listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      const unsubscribe1 = notifyManager.subscribe(listener1)
      notifyManager.subscribe(listener2)

      notifyManager.notify(() => {})
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      unsubscribe1()

      notifyManager.notify(() => {})
      expect(listener1).toHaveBeenCalledTimes(1) // No more calls
      expect(listener2).toHaveBeenCalledTimes(2) // Still called
    })
  })

  describe('BatchManager', () => {
    test('should batch updates', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      batchManager.batch(callback1)
      batchManager.batch(callback2)
      
      // Should be called asynchronously
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
      
      // BatchManager uses RAF by default, need to advance timers and wait for microtask
      vi.advanceTimersByTime(20)
      await Promise.resolve() // Wait for microtask/RAF
      
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

    test('should use RAF strategy when available', async () => {
      const { BatchManager } = await import('../managers/BatchManager')
      const manager = new BatchManager({ flushStrategy: 'raf' })
      const callback = vi.fn()

      manager.batch(callback)

      expect(callback).not.toHaveBeenCalled()

      // Simulate RAF
      if (typeof requestAnimationFrame !== 'undefined') {
        // RAF should trigger flush
        vi.advanceTimersByTime(16) // ~1 frame
      } else {
        // Fallback to setTimeout
        vi.advanceTimersByTime(0)
      }

      expect(callback).toHaveBeenCalled()
      manager.dispose()
    })

    test('should use microtask strategy', async () => {
      const { BatchManager } = await import('../managers/BatchManager')
      const manager = new BatchManager({ flushStrategy: 'microtask' })
      const callback = vi.fn()

      manager.batch(callback)

      expect(callback).not.toHaveBeenCalled()

      // Microtask should flush on next tick
      return Promise.resolve().then(() => {
        expect(callback).toHaveBeenCalled()
        manager.dispose()
      })
    })

    test('should handle errors in batched updates', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const callback1 = vi.fn()
      const callback2 = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      const callback3 = vi.fn()

      batchManager.batch(callback1)
      batchManager.batch(callback2)
      batchManager.batch(callback3)

      batchManager.flush()

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(callback3).toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })

    test('should dispose and clean up', async () => {
      const { BatchManager } = await import('../managers/BatchManager')
      const manager = new BatchManager({ flushStrategy: 'raf' })
      const callback = vi.fn()

      manager.batch(callback)
      manager.dispose()

      // After dispose, callback should still be called (from flush)
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
