// NotifyManager - Manages batching and notification of state changes
// Uses microtask/RAF for minimal re-renders with guaranteed ordering

type FlushStrategy = 'microtask' | 'raf' | 'immediate'

interface NotifyManagerOptions {
  flushStrategy?: FlushStrategy
  maxBatchSize?: number
}

export class NotifyManager {
  private listeners = new Set<() => void>()
  private batchNotify = false
  private notifyQueue: Array<() => void> = []
  private flushStrategy: FlushStrategy
  private maxBatchSize: number
  private rafId: number | null = null

  constructor(options: NotifyManagerOptions = {}) {
    this.flushStrategy = options.flushStrategy || 'microtask'
    this.maxBatchSize = options.maxBatchSize || 1000
    this.scheduleBatchNotify = this.scheduleBatchNotify.bind(this)
    this.flush = this.flush.bind(this)
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private scheduleBatchNotify() {
    if (this.batchNotify) {
      return
    }

    // Prevent excessive queue growth
    if (this.notifyQueue.length >= this.maxBatchSize) {
      this.flush()
      return
    }

    this.batchNotify = true

    switch (this.flushStrategy) {
      case 'microtask':
        // Use microtask for guaranteed ordering within the same tick
        Promise.resolve().then(() => {
          this.flush()
        })
        break
      case 'raf':
        // Use requestAnimationFrame for visual updates
        if (typeof requestAnimationFrame !== 'undefined') {
          this.rafId = requestAnimationFrame(() => {
            this.flush()
          })
        } else {
          // Fallback for Node.js environments
          Promise.resolve().then(() => {
            this.flush()
          })
        }
        break
      case 'immediate':
        // Immediate execution (no batching)
        this.flush()
        break
    }
  }

  notify(callback: () => void) {
    if (this.batchNotify) {
      this.notifyQueue.push(callback)
    } else {
      callback()
    }
    // Notify listeners immediately (they handle their own batching)
    this.listeners.forEach(listener => listener())
  }

  batchNotifyUpdates(callback: () => void) {
    this.notifyQueue.push(callback)
    this.scheduleBatchNotify()
    // Also notify listeners immediately
    this.listeners.forEach(listener => listener())
  }

  flush() {
    if (!this.batchNotify) {
      return
    }

    // Cancel any pending RAF
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.batchNotify = false
    const queue = this.notifyQueue.slice()
    this.notifyQueue = []
    
    // Execute all batched notifications
    queue.forEach(notify => {
      try {
        notify()
      } catch (error) {
        console.error('Error in batched notification:', error)
      }
    })
  }

  dispose() {
    this.flush()
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}

export const notifyManager = new NotifyManager({ flushStrategy: 'microtask' })
