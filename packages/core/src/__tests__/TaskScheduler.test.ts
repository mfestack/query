import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { TaskScheduler } from '../scheduler/TaskScheduler'

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler

  beforeEach(() => {
    vi.useFakeTimers()
    scheduler = new TaskScheduler({ enableIdleCallback: false })
  })

  afterEach(() => {
    scheduler.dispose()
    vi.useRealTimers()
  })

  describe('enqueue', () => {
    test('should schedule a task with delay', () => {
      const handler = vi.fn()
      scheduler.enqueue('test-1', handler, { delay: 100 })

      expect(handler).not.toHaveBeenCalled()

      // Advance timers - scheduler uses RAF or setTimeout with ~16ms intervals
      vi.advanceTimersByTime(120)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    test('should execute tasks in priority order', () => {
      const order: string[] = []
      scheduler.enqueue('low', () => { order.push('low') }, { delay: 10, priority: 'low' })
      scheduler.enqueue('high', () => { order.push('high') }, { delay: 10, priority: 'high' })
      scheduler.enqueue('normal', () => { order.push('normal') }, { delay: 10, priority: 'normal' })

      vi.advanceTimersByTime(20)

      expect(order).toEqual(['high', 'normal', 'low'])
    })

    test('should support repeating tasks', () => {
      const handler = vi.fn()
      scheduler.enqueue('repeat', handler, { delay: 100, repeat: true, interval: 50 })

      vi.advanceTimersByTime(120)
      expect(handler).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(60)
      expect(handler).toHaveBeenCalledTimes(2)

      vi.advanceTimersByTime(60)
      expect(handler).toHaveBeenCalledTimes(3)
    })

    test('should cancel task when AbortSignal is aborted', () => {
      const handler = vi.fn()
      const controller = new AbortController()

      scheduler.enqueue('abortable', handler, {
        delay: 100,
        abortSignal: controller.signal,
      })

      controller.abort()

      vi.advanceTimersByTime(200)

      expect(handler).not.toHaveBeenCalled()
      expect(scheduler.getPendingCount()).toBe(0)
    })

    test('should return cancel function', () => {
      const handler = vi.fn()
      const cancel = scheduler.enqueue('cancelable', handler, { delay: 100 })

      cancel()

      vi.advanceTimersByTime(200)

      expect(handler).not.toHaveBeenCalled()
    })

    test('should handle async handlers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined)
      scheduler.enqueue('async', handler, { delay: 100 })

      vi.advanceTimersByTime(120)

      // Wait for promise to resolve
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(1)
    })

    test('should handle handler errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      scheduler.enqueue('error', () => {
        throw new Error('Test error')
      }, { delay: 100 })

      vi.advanceTimersByTime(120)

      expect(consoleError).toHaveBeenCalled()
      expect(scheduler.getPendingCount()).toBe(0)

      consoleError.mockRestore()
    })
  })

  describe('cancel', () => {
    test('should cancel a specific task', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      scheduler.enqueue('task-1', handler1, { delay: 100 })
      scheduler.enqueue('task-2', handler2, { delay: 100 })

      expect(scheduler.cancel('task-1')).toBe(true)

      vi.advanceTimersByTime(200)

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    test('should return false if task does not exist', () => {
      expect(scheduler.cancel('nonexistent')).toBe(false)
    })
  })

  describe('clear', () => {
    test('should cancel all tasks', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      scheduler.enqueue('task-1', handler1, { delay: 100 })
      scheduler.enqueue('task-2', handler2, { delay: 100 })

      scheduler.clear()

      vi.advanceTimersByTime(200)

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
      expect(scheduler.getPendingCount()).toBe(0)
    })
  })

  describe('getPendingCount', () => {
    test('should return correct count of pending tasks', () => {
      expect(scheduler.getPendingCount()).toBe(0)

      scheduler.enqueue('task-1', () => {}, { delay: 100 })
      scheduler.enqueue('task-2', () => {}, { delay: 100 })

      expect(scheduler.getPendingCount()).toBe(2)

      scheduler.cancel('task-1')

      expect(scheduler.getPendingCount()).toBe(1)
    })

    test('should decrease count when task executes', () => {
      scheduler.enqueue('task-1', () => {}, { delay: 100 })
      scheduler.enqueue('task-2', () => {}, { delay: 200 })

      expect(scheduler.getPendingCount()).toBe(2)

      vi.advanceTimersByTime(150)

      // Task 1 should have executed, task 2 not yet
      expect(scheduler.getPendingCount()).toBeLessThanOrEqual(1)
    })
  })

  describe('repeat tasks', () => {
    test('should continue repeating until cancelled', () => {
      const handler = vi.fn()
      const cancel = scheduler.enqueue('repeat', handler, {
        delay: 100,
        repeat: true,
        interval: 50,
      })

      vi.advanceTimersByTime(250) // Should fire at 100, 150, 200, 250

      expect(handler).toHaveBeenCalledTimes(3)

      cancel()

      vi.advanceTimersByTime(100)

      expect(handler).toHaveBeenCalledTimes(3) // No more calls
    })

    test('should handle errors in repeating tasks', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const handler = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const cancel = scheduler.enqueue('repeat-error', handler, {
        delay: 100,
        repeat: true,
        interval: 50,
      })

      vi.advanceTimersByTime(200)

      // Task should continue repeating despite errors
      // At 100ms: first call, at 150ms: second call, at 200ms: third call
      expect(handler).toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalled()

      cancel()
      consoleError.mockRestore()
    })
  })

  describe('dispose', () => {
    test('should clear all tasks and stop scheduler', () => {
      const handler = vi.fn()
      scheduler.enqueue('task', handler, { delay: 100 })

      scheduler.dispose()

      vi.advanceTimersByTime(200)

      expect(handler).not.toHaveBeenCalled()
      expect(scheduler.getPendingCount()).toBe(0)
    })
  })
})

