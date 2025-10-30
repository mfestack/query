// NotifyManager - Manages batching and notification of state changes
export class NotifyManager {
  private listeners = new Set<() => void>()
  private batchNotify = false
  private notifyQueue: Array<() => void> = []

  constructor() {
    this.scheduleBatchNotify = this.scheduleBatchNotify.bind(this)
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

    this.batchNotify = true
    // Use microtask to batch notifications
    Promise.resolve().then(() => {
      this.batchNotify = false
      this.notifyQueue.forEach(notify => notify())
      this.notifyQueue = []
    })
  }

  notify(callback: () => void) {
    if (this.batchNotify) {
      this.notifyQueue.push(callback)
    } else {
      callback()
    }
    // Notify listeners
    this.listeners.forEach(listener => listener())
  }

  batchNotifyUpdates(callback: () => void) {
    this.notifyQueue.push(callback)
    this.scheduleBatchNotify()
    // Also notify listeners immediately
    this.listeners.forEach(listener => listener())
  }

  flush() {
    if (this.batchNotify) {
      this.batchNotify = false
      this.notifyQueue.forEach(notify => notify())
      this.notifyQueue = []
    }
  }
}

export const notifyManager = new NotifyManager()
