// TaskScheduler - Unified scheduler for refetch intervals, GC timers, retry backoff, and background tasks

export type TaskPriority = 'high' | 'normal' | 'low'
export type TaskId = string | number

export interface Task {
  id: TaskId
  handler: () => void | Promise<void>
  priority: TaskPriority
  delay: number
  repeat?: boolean
  interval?: number
  abortSignal?: AbortSignal
  createdAt: number
  nextExecutionTime: number
}

interface TaskSchedulerOptions {
  enableIdleCallback?: boolean
  idleTimeout?: number
}

export class TaskScheduler {
  private taskQueue: Map<TaskId, Task> = new Map()
  private timerId: ReturnType<typeof setTimeout> | null = null
  private rafId: number | null = null
  private idleId: number | null = null
  private isRunning = false
  private enableIdleCallback: boolean
  private idleTimeout: number
  private tickInterval = 16 // ~60fps check interval

  constructor(options: TaskSchedulerOptions = {}) {
    this.enableIdleCallback = options.enableIdleCallback ?? true
    this.idleTimeout = options.idleTimeout ?? 1000
    this.start()
  }

  /**
   * Enqueue a task with optional delay and repeat
   */
  enqueue(
    id: TaskId,
    handler: () => void | Promise<void>,
    options: {
      delay?: number
      repeat?: boolean
      interval?: number
      priority?: TaskPriority
      abortSignal?: AbortSignal
    } = {}
  ): () => void {
    const {
      delay = 0,
      repeat = false,
      interval = 0,
      priority = 'normal',
      abortSignal,
    } = options

    const now = Date.now()
    const task: Task = {
      id,
      handler,
      priority,
      delay,
      repeat,
      interval: repeat ? (interval || delay) : 0,
      abortSignal,
      createdAt: now,
      nextExecutionTime: now + delay,
    }

    // Handle abort signal
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        this.cancel(id)
      })
    }

    this.taskQueue.set(id, task)
    this.schedule()

    // Return cancel function
    return () => this.cancel(id)
  }

  /**
   * Cancel a task
   */
  cancel(id: TaskId): boolean {
    return this.taskQueue.delete(id)
  }

  /**
   * Cancel all tasks
   */
  clear(): void {
    this.taskQueue.clear()
    this.stop()
  }

  /**
   * Get count of pending tasks
   */
  getPendingCount(): number {
    return this.taskQueue.size
  }

  /**
   * Execute tasks that are due
   */
  private executeDueTasks(): void {
    const now = Date.now()
    const tasksToExecute: Task[] = []

    // Collect tasks that are due, sorted by priority
    for (const task of this.taskQueue.values()) {
      if (task.abortSignal?.aborted) {
        this.taskQueue.delete(task.id)
        continue
      }

      if (task.nextExecutionTime <= now) {
        tasksToExecute.push(task)
      }
    }

    // Sort by priority: high -> normal -> low
    tasksToExecute.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Execute tasks
    for (const task of tasksToExecute) {
      try {
        const result = task.handler()
        
        // Handle async handlers
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Error executing task ${task.id}:`, error)
          })
        }

        // Reschedule if repeat is enabled
        if (task.repeat && task.interval) {
          task.nextExecutionTime = now + task.interval
        } else {
          // Remove one-time tasks
          this.taskQueue.delete(task.id)
        }
      } catch (error) {
        console.error(`Error executing task ${task.id}:`, error)
        // Remove failed tasks unless they're set to repeat
        if (!task.repeat) {
          this.taskQueue.delete(task.id)
        }
      }
    }
  }

  /**
   * Start the scheduler tick loop
   */
  private start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.tick()
  }

  /**
   * Stop the scheduler
   */
  private stop(): void {
    this.isRunning = false
    
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.idleId !== null && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(this.idleId)
      this.idleId = null
    }
  }

  /**
   * Schedule the next check using appropriate API
   */
  private schedule(): void {
    if (!this.isRunning || this.taskQueue.size === 0) {
      return
    }

    // Use idle callback for low priority tasks if available
    if (this.enableIdleCallback && typeof requestIdleCallback !== 'undefined') {
      if (this.idleId === null) {
        this.idleId = requestIdleCallback(
          () => {
            this.idleId = null
            this.tick()
          },
          { timeout: this.idleTimeout }
        )
      }
    } else {
      // Use RAF for visual updates
      if (this.rafId === null && typeof requestAnimationFrame !== 'undefined') {
        this.rafId = requestAnimationFrame(() => {
          this.rafId = null
          this.tick()
        })
      } else if (this.timerId === null) {
        // Fallback to setTimeout
        this.timerId = setTimeout(() => {
          this.timerId = null
          this.tick()
        }, this.tickInterval)
      }
    }
  }

  /**
   * Main tick loop - checks and executes due tasks
   */
  private tick(): void {
    if (!this.isRunning) {
      return
    }

    this.executeDueTasks()

    // Schedule next tick if there are remaining tasks
    if (this.taskQueue.size > 0) {
      this.schedule()
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.clear()
  }
}

// Singleton instance
export const taskScheduler = new TaskScheduler()

