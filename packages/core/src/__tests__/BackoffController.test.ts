import { describe, expect, test, vi } from 'vitest'
import { BackoffController, defaultBackoffController } from '../scheduler/BackoffController'

describe('BackoffController', () => {
  describe('exponential strategy', () => {
    test('should calculate exponential backoff correctly', () => {
      const controller = new BackoffController({
        baseDelay: 1000,
        factor: 2,
        strategy: 'exponential',
        jitter: false,
      })

      expect(controller.calculateDelay(0)).toBe(1000) // 1000 * 2^0
      expect(controller.calculateDelay(1)).toBe(2000) // 1000 * 2^1
      expect(controller.calculateDelay(2)).toBe(4000) // 1000 * 2^2
      expect(controller.calculateDelay(3)).toBe(8000) // 1000 * 2^3
    })

    test('should respect maxDelay', () => {
      const controller = new BackoffController({
        baseDelay: 1000,
        factor: 2,
        maxDelay: 5000,
        strategy: 'exponential',
        jitter: false,
      })

      expect(controller.calculateDelay(0)).toBe(1000)
      expect(controller.calculateDelay(1)).toBe(2000)
      expect(controller.calculateDelay(2)).toBe(4000)
      expect(controller.calculateDelay(3)).toBe(5000) // Capped at maxDelay
      expect(controller.calculateDelay(10)).toBe(5000) // Still capped
    })
  })

  describe('linear strategy', () => {
    test('should calculate linear backoff correctly', () => {
      const controller = new BackoffController({
        baseDelay: 1000,
        strategy: 'linear',
        jitter: false,
      })

      expect(controller.calculateDelay(0)).toBe(1000) // 1000 * (0 + 1)
      expect(controller.calculateDelay(1)).toBe(2000) // 1000 * (1 + 1)
      expect(controller.calculateDelay(2)).toBe(3000) // 1000 * (2 + 1)
      expect(controller.calculateDelay(3)).toBe(4000) // 1000 * (3 + 1)
    })

    test('should respect maxDelay with linear strategy', () => {
      const controller = new BackoffController({
        baseDelay: 1000,
        maxDelay: 2500,
        strategy: 'linear',
        jitter: false,
      })

      expect(controller.calculateDelay(0)).toBe(1000)
      expect(controller.calculateDelay(1)).toBe(2000)
      expect(controller.calculateDelay(2)).toBe(2500) // Capped
      expect(controller.calculateDelay(10)).toBe(2500) // Still capped
    })
  })

  describe('constant strategy', () => {
    test('should return constant delay', () => {
      const controller = new BackoffController({
        baseDelay: 1000,
        strategy: 'constant',
        jitter: false,
      })

      expect(controller.calculateDelay(0)).toBe(1000)
      expect(controller.calculateDelay(1)).toBe(1000)
      expect(controller.calculateDelay(10)).toBe(1000)
      expect(controller.calculateDelay(100)).toBe(1000)
    })
  })

  describe('custom strategy', () => {
    test('should use custom function for delay calculation', () => {
      const customStrategy = (attempt: number) => attempt * attempt * 1000
      const controller = new BackoffController({
        baseDelay: 1000,
        strategy: customStrategy,
        jitter: false,
      })

      expect(controller.calculateDelay(0)).toBe(0)
      expect(controller.calculateDelay(1)).toBe(1000)
      expect(controller.calculateDelay(2)).toBe(4000)
      expect(controller.calculateDelay(3)).toBe(9000)
    })

    test('should respect maxDelay with custom strategy', () => {
      const customStrategy = (attempt: number) => attempt * 10000
      const controller = new BackoffController({
        baseDelay: 1000,
        maxDelay: 15000,
        strategy: customStrategy,
        jitter: false,
      })

      expect(controller.calculateDelay(0)).toBe(0)
      expect(controller.calculateDelay(1)).toBe(10000)
      expect(controller.calculateDelay(2)).toBe(15000) // Capped
      expect(controller.calculateDelay(10)).toBe(15000) // Still capped
    })
  })

  describe('jitter', () => {
    test('should add jitter when enabled', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5) // 50% jitter = ±10% of delay

      const controller = new BackoffController({
        baseDelay: 1000,
        factor: 2,
        strategy: 'exponential',
        jitter: true,
      })

      const delay = controller.calculateDelay(1) // Would be 2000 without jitter
      // With 10% jitter, should be between 1800 and 2200
      expect(delay).toBeGreaterThanOrEqual(1800)
      expect(delay).toBeLessThanOrEqual(2200)

      vi.spyOn(Math, 'random').mockRestore()
    })

    test('should return non-negative delay with jitter', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // Maximum jitter

      const controller = new BackoffController({
        baseDelay: 100,
        strategy: 'constant',
        jitter: true,
      })

      const delay = controller.calculateDelay(0)
      expect(delay).toBeGreaterThanOrEqual(0)

      vi.spyOn(Math, 'random').mockRestore()
    })
  })

  describe('edge cases', () => {
    test('should handle zero baseDelay', () => {
      const controller = new BackoffController({
        baseDelay: 0,
        strategy: 'exponential',
        jitter: false,
      })

      expect(controller.calculateDelay(0)).toBe(0)
      expect(controller.calculateDelay(1)).toBe(0)
    })

    test('should handle negative attempts gracefully', () => {
      const controller = new BackoffController({
        baseDelay: 1000,
        factor: 2,
        strategy: 'exponential',
        jitter: false,
      })

      // Should return at least 0
      const delay = controller.calculateDelay(-1)
      expect(delay).toBeGreaterThanOrEqual(0)
    })

    test('should round delay to integer', () => {
      const controller = new BackoffController({
        baseDelay: 333.33,
        strategy: 'constant',
        jitter: false,
      })

      const delay = controller.calculateDelay(0)
      expect(Number.isInteger(delay)).toBe(true)
    })
  })

  describe('defaultBackoffController', () => {
    test('should be configured with exponential strategy and jitter', () => {
      expect(defaultBackoffController.calculateDelay(0)).toBeGreaterThan(0)
      expect(defaultBackoffController.calculateDelay(1)).toBeGreaterThan(1000)
      expect(defaultBackoffController.calculateDelay(2)).toBeGreaterThan(2000)
    })

    test('should respect maxDelay', () => {
      const delay10 = defaultBackoffController.calculateDelay(10)
      const delay20 = defaultBackoffController.calculateDelay(20)
      
      // Both should be capped at 30000 (with some tolerance for jitter)
      // Jitter can add up to 10% of delay, so maxDelay * 1.1 is reasonable
      expect(delay10).toBeLessThanOrEqual(30000 * 1.15) // Allow some jitter tolerance
      expect(delay20).toBeLessThanOrEqual(30000 * 1.15)
    })
  })

  describe('reset', () => {
    test('should be callable without errors', () => {
      const controller = new BackoffController()
      expect(() => controller.reset()).not.toThrow()
    })

    test('should maintain same behavior after reset', () => {
      const controller = new BackoffController({
        baseDelay: 1000,
        strategy: 'exponential',
        jitter: false,
      })

      const before = controller.calculateDelay(2)
      controller.reset()
      const after = controller.calculateDelay(2)

      expect(before).toBe(after)
    })
  })
})

