// BackoffController - Calculates retry intervals using exponential or custom backoff strategies

export type BackoffStrategy = 'exponential' | 'linear' | 'constant' | ((attempt: number) => number)

export interface BackoffOptions {
  baseDelay?: number
  maxDelay?: number
  factor?: number
  strategy?: BackoffStrategy
  jitter?: boolean
}

export class BackoffController {
  private baseDelay: number
  private maxDelay: number
  private factor: number
  private strategy: BackoffStrategy
  private jitter: boolean

  constructor(options: BackoffOptions = {}) {
    this.baseDelay = options.baseDelay ?? 1000
    this.maxDelay = options.maxDelay ?? 30000
    this.factor = options.factor ?? 2
    this.strategy = options.strategy ?? 'exponential'
    this.jitter = options.jitter ?? false
  }

  /**
   * Calculate delay for a given attempt number
   */
  calculateDelay(attempt: number): number {
    let delay: number

    switch (this.strategy) {
      case 'exponential':
        delay = this.baseDelay * Math.pow(this.factor, attempt)
        break
      case 'linear':
        delay = this.baseDelay * (attempt + 1)
        break
      case 'constant':
        delay = this.baseDelay
        break
      default:
        // Custom strategy function
        delay = this.strategy(attempt)
        break
    }

    // Apply max delay cap
    delay = Math.min(delay, this.maxDelay)

    // Apply jitter to prevent thundering herd
    if (this.jitter) {
      const jitterAmount = delay * 0.1 // 10% jitter
      delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount)
    }

    return Math.max(0, Math.round(delay))
  }

  /**
   * Reset backoff (useful for resetting state)
   */
  reset(): void {
    // No state to reset in this implementation
  }
}

/**
 * Default exponential backoff controller
 */
export const defaultBackoffController = new BackoffController({
  baseDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  strategy: 'exponential',
  jitter: true,
})

