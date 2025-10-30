// Retryer - Manages retry logic with exponential backoff
export class Retryer {
  private retryCount = 0
  private maxRetries: number
  private retryDelay: (attemptIndex: number) => number
  private isRetrying = false

  constructor(
    maxRetries: number = 3,
    retryDelay: (attemptIndex: number) => number = (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  ) {
    this.maxRetries = maxRetries
    this.retryDelay = retryDelay
  }

  async run<T>(
    fn: () => Promise<T>,
    options?: {
      retry?: number | boolean
      retryDelay?: (attemptIndex: number) => number
    }
  ): Promise<T> {
    const maxRetries = options?.retry === false ? 0 : (options?.retry === true ? 3 : (typeof options?.retry === 'number' ? options.retry : this.maxRetries))
    const retryDelay = options?.retryDelay || this.retryDelay
    
    this.retryCount = 0
    this.isRetrying = true

    while (this.retryCount <= maxRetries && this.isRetrying) {
      try {
        const result = await fn()
        this.isRetrying = false
        return result
      } catch (error) {
        if (this.retryCount >= maxRetries || !this.isRetrying) {
          this.isRetrying = false
          throw error
        }
        
        this.retryCount++
        const delay = retryDelay(this.retryCount)
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (error: Error, attempt: number) => void
  ): Promise<T> {
    this.retryCount = 0
    this.isRetrying = true

    while (this.retryCount <= this.maxRetries) {
      try {
        const result = await fn()
        this.isRetrying = false
        return result
      } catch (error) {
        if (this.retryCount >= this.maxRetries) {
          this.isRetrying = false
          throw error
        }

        this.retryCount++
        onRetry?.(error as Error, this.retryCount)

        const delay = this.retryDelay(this.retryCount - 1)
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw new Error('Max retries exceeded')
  }

  cancel() {
    this.isRetrying = false
    this.retryCount = 0
  }

  getRetryingStatus() {
    return this.isRetrying
  }

  getRetryCount() {
    return this.retryCount
  }
}

export const retryer = new Retryer()
