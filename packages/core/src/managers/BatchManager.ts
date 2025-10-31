// BatchManager - Manages batching of state updates to prevent excessive re-renders
// Uses RAF/idle flush for optimal performance

type FlushStrategy = 'microtask' | 'raf' | 'idle'

interface BatchManagerOptions {
  flushStrategy?: FlushStrategy
  batchInterval?: number
}

export class BatchManager {
  private batchUpdate = false
  private updateQueue: Array<() => void> = []
  private flushStrategy: FlushStrategy
  private batchInterval: number
  private rafId: number | null = null
  private idleId: number | null = null

  constructor(options: BatchManagerOptions = {}) {
    this.flushStrategy = options.flushStrategy || 'raf'
    this.batchInterval = options.batchInterval || 0
    this.scheduleBatchUpdate = this.scheduleBatchUpdate.bind(this)
    this.flush = this.flush.bind(this)
  }

  private scheduleBatchUpdate() {
    if (this.batchUpdate) {
      return
    }

    this.batchUpdate = true

    switch (this.flushStrategy) {
      case 'microtask':
        // Use microtask for immediate batching
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
          setTimeout(() => {
            this.flush()
          }, this.batchInterval)
        }
        break
      case 'idle':
        // Use requestIdleCallback for non-critical updates
        if (typeof requestIdleCallback !== 'undefined') {
          this.idleId = requestIdleCallback(
            () => {
              this.flush()
            },
            { timeout: 1000 }
          )
        } else if (typeof requestAnimationFrame !== 'undefined') {
          // Fallback to RAF
          this.rafId = requestAnimationFrame(() => {
            this.flush()
          })
        } else {
          // Fallback to setTimeout
          setTimeout(() => {
            this.flush()
          }, this.batchInterval)
        }
        break
    }
  }

  batch(update: () => void) {
    this.updateQueue.push(update)
    this.scheduleBatchUpdate()
  }

  flush() {
    if (!this.batchUpdate) {
      return
    }

    // Cancel any pending timers
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.idleId !== null && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(this.idleId)
      this.idleId = null
    }

    this.batchUpdate = false
    const queue = this.updateQueue.slice()
    this.updateQueue = []
    
    // Execute all batched updates
    queue.forEach(update => {
      try {
        update()
      } catch (error) {
        console.error('Error in batched update:', error)
      }
    })
  }

  dispose() {
    this.flush()
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.idleId !== null && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(this.idleId)
      this.idleId = null
    }
  }
}

export const batchManager = new BatchManager({ flushStrategy: 'raf' })
