// BatchManager - Manages batching of state updates to prevent excessive re-renders
export class BatchManager {
  private batchUpdate = false
  private updateQueue: Array<() => void> = []

  constructor() {
    this.scheduleBatchUpdate = this.scheduleBatchUpdate.bind(this)
  }

  private scheduleBatchUpdate() {
    if (this.batchUpdate) {
      return
    }

    this.batchUpdate = true
    // Use setTimeout to batch updates
    setTimeout(() => {
      this.batchUpdate = false
      this.updateQueue.forEach(update => update())
      this.updateQueue = []
    }, 0)
  }

  batch(update: () => void) {
    this.updateQueue.push(update)
    this.scheduleBatchUpdate()
  }

  flush() {
    if (this.batchUpdate) {
      this.batchUpdate = false
      this.updateQueue.forEach(update => update())
      this.updateQueue = []
    }
  }
}

export const batchManager = new BatchManager()
