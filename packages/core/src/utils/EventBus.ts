// EventBus - Typed event system with replay buffer and priorities
import type { Query } from '../query/Query'
import type { Mutation } from '../mutation/Mutation'
import type { DehydratedState } from '../types'

/**
 * Event priority levels for dispatch scheduling
 */
export type EventPriority = 'high' | 'normal' | 'low'

/**
 * Base event metadata
 */
export interface BaseEvent {
  timestamp: number
  priority?: EventPriority
}

/**
 * Typed event definitions for AppStack Query
 */
export interface AppStackEvents {
  // Query lifecycle events
  'query:added': { query: Query }
  'query:updated': { query: Query; state?: any }
  'query:removed': { query: Query }

  // Mutation lifecycle events
  'mutation:started': { mutation: Mutation }
  'mutation:success': { mutation: Mutation; data: unknown }
  'mutation:error': { mutation: Mutation; error: Error }
  'mutation:removed': { mutation: Mutation }

  // Cache events
  'cache:invalidated': { queryKeys?: any[]; filters?: any }
  'cache:cleared': Record<string, never>

  // Persistence events
  'persist:hydrated': { state: DehydratedState }
  'persist:restored': { state: DehydratedState }
  'persist:failed': { error: Error }

  // Broadcast events
  'broadcast:received': { state: DehydratedState; origin: string }
  'broadcast:failed': { error: Error }

  // DevTools events
  'devtools:inspect': { snapshot?: any }
  'devtools:action': { type: string; payload?: any }

  // System events
  'system:focus': { isFocused: boolean }
  'system:online': { isOnline: boolean }
}

/**
 * Typed event payload with metadata
 */
export type TypedEvent<K extends keyof AppStackEvents = keyof AppStackEvents> = BaseEvent & {
  type: K
  payload: AppStackEvents[K]
}

/**
 * Event listener function type
 */
export type EventListener<T extends keyof AppStackEvents = keyof AppStackEvents> = (
  payload: AppStackEvents[T]
) => void

/**
 * Replay buffer configuration
 */
export interface ReplayConfig {
  maxSize: number
  enabled: boolean
}

/**
 * EventBus options
 */
export interface EventBusOptions {
  enableReplay?: boolean
  defaultPriority?: EventPriority
  replayBufferSize?: number
}

/**
 * Typed EventBus with replay buffer and priority queuing
 */
export class EventBus {
  private listeners = new Map<keyof AppStackEvents, Set<EventListener>>()
  private replayBuffers = new Map<keyof AppStackEvents, TypedEvent[]>()
  private replayConfigs = new Map<keyof AppStackEvents, ReplayConfig>()
  private defaultPriority: EventPriority
  private pendingNormal: TypedEvent[] = []
  private pendingLow: TypedEvent[] = []
  private isFlushing = false

  constructor(options: EventBusOptions = {}) {
    this.defaultPriority = options.defaultPriority || 'normal'
    
    if (options.enableReplay !== false) {
      // Enable replay for common events by default
      this.enableReplay('query:added', { maxSize: options.replayBufferSize || 50, enabled: true })
      this.enableReplay('query:updated', { maxSize: options.replayBufferSize || 50, enabled: true })
      this.enableReplay('mutation:started', { maxSize: options.replayBufferSize || 50, enabled: true })
      this.enableReplay('mutation:success', { maxSize: options.replayBufferSize || 50, enabled: true })
      this.enableReplay('mutation:error', { maxSize: options.replayBufferSize || 50, enabled: true })
    }
  }

  /**
   * Subscribe to an event type
   */
  on<K extends keyof AppStackEvents>(
    event: K,
    listener: EventListener<K>,
    options?: { replay?: boolean }
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    const listeners = this.listeners.get(event)!
    listeners.add(listener as EventListener)

    // Replay buffered events if requested
    if (options?.replay !== false && this.replayBuffers.has(event)) {
      const buffer = this.replayBuffers.get(event)!
      buffer.forEach(typedEvent => {
        listener(typedEvent.payload as AppStackEvents[K])
      })
    }

    // Return unsubscribe function
    return () => {
      listeners.delete(listener as EventListener)
      if (listeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Unsubscribe from an event type
   */
  off<K extends keyof AppStackEvents>(event: K, listener: EventListener<K>): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(listener as EventListener)
      if (listeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Emit an event with optional priority
   */
  emit<K extends keyof AppStackEvents>(
    event: K,
    payload: AppStackEvents[K],
    priority?: EventPriority
  ): void {
    const typedEvent: TypedEvent<K> = {
      type: event,
      payload,
      timestamp: Date.now(),
      priority: priority || this.defaultPriority,
    }

    // Store in replay buffer if enabled
    if (this.replayConfigs.has(event)) {
      this.addToReplayBuffer(event, typedEvent)
    }

    // Dispatch based on priority
    this.dispatch(typedEvent)
  }

  /**
   * Dispatch event based on priority
   */
  private dispatch(event: TypedEvent): void {
    const priority = event.priority || this.defaultPriority

    switch (priority) {
      case 'high':
        // Dispatch immediately (synchronously)
        this.flushEvent(event)
        break
      case 'normal':
        // Queue in microtask
        this.pendingNormal.push(event)
        if (!this.isFlushing) {
          queueMicrotask(() => this.flushNormal())
        }
        break
      case 'low':
        // Schedule in idle callback if available, otherwise use setTimeout
        this.pendingLow.push(event)
        if (!this.isFlushing) {
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => this.flushLow(), { timeout: 5000 })
          } else {
            setTimeout(() => this.flushLow(), 0)
          }
        }
        break
    }
  }

  /**
   * Flush high priority events (synchronous)
   */
  private flushEvent(event: TypedEvent): void {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event.payload)
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error)
        }
      })
    }
  }

  /**
   * Flush normal priority events (microtask)
   */
  private flushNormal(): void {
    if (this.isFlushing) return
    this.isFlushing = true

    const events = this.pendingNormal.splice(0)
    events.forEach(event => {
      this.flushEvent(event)
    })

    this.isFlushing = false
  }

  /**
   * Flush low priority events (idle callback)
   */
  private flushLow(): void {
    if (this.isFlushing) return
    this.isFlushing = true

    const events = this.pendingLow.splice(0)
    events.forEach(event => {
      this.flushEvent(event)
    })

    this.isFlushing = false
  }

  /**
   * Enable replay buffer for a specific event type
   */
  enableReplay<K extends keyof AppStackEvents>(
    event: K,
    config: ReplayConfig
  ): void {
    this.replayConfigs.set(event, config)
    if (!this.replayBuffers.has(event)) {
      this.replayBuffers.set(event, [])
    }
  }

  /**
   * Disable replay buffer for a specific event type
   */
  disableReplay<K extends keyof AppStackEvents>(event: K): void {
    this.replayConfigs.delete(event)
    this.replayBuffers.delete(event)
  }

  /**
   * Add event to replay buffer
   */
  private addToReplayBuffer<K extends keyof AppStackEvents>(
    event: K,
    typedEvent: TypedEvent<K>
  ): void {
    const config = this.replayConfigs.get(event)
    if (!config || !config.enabled) return

    let buffer = this.replayBuffers.get(event)
    if (!buffer) {
      buffer = []
      this.replayBuffers.set(event, buffer)
    }

    buffer.push(typedEvent)

    // Trim buffer if exceeds max size
    if (buffer.length > config.maxSize) {
      buffer.shift()
    }
  }

  /**
   * Get replay buffer for an event type
   */
  getReplayBuffer<K extends keyof AppStackEvents>(event: K): TypedEvent<K>[] {
    return (this.replayBuffers.get(event) || []) as TypedEvent<K>[]
  }

  /**
   * Clear replay buffer for an event type
   */
  clearReplayBuffer<K extends keyof AppStackEvents>(event: K): void {
    this.replayBuffers.delete(event)
  }

  /**
   * Clear all replay buffers
   */
  clearAllReplayBuffers(): void {
    this.replayBuffers.clear()
  }

  /**
   * Get all listeners for an event type
   */
  getListenerCount<K extends keyof AppStackEvents>(event: K): number {
    return this.listeners.get(event)?.size || 0
  }

  /**
   * Remove all listeners and clear buffers
   */
  dispose(): void {
    this.listeners.clear()
    this.replayBuffers.clear()
    this.replayConfigs.clear()
    this.pendingNormal = []
    this.pendingLow = []
  }
}

