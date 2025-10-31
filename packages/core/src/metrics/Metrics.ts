// Lightweight metrics registry that listens to EventBus and maintains counters
import type { EventBus } from '../utils/EventBus'

export interface MetricsSnapshot {
  queriesFetched: number
  queriesSucceeded: number
  queriesFailed: number
  cacheInvalidations: number
  cacheClears: number
  mutationsStarted: number
  mutationsSucceeded: number
  mutationsFailed: number
  lastUpdatedAt: number
}

type MetricsListener = (snapshot: MetricsSnapshot) => void

export class Metrics {
  private snapshot: MetricsSnapshot = {
    queriesFetched: 0,
    queriesSucceeded: 0,
    queriesFailed: 0,
    cacheInvalidations: 0,
    cacheClears: 0,
    mutationsStarted: 0,
    mutationsSucceeded: 0,
    mutationsFailed: 0,
    lastUpdatedAt: Date.now(),
  }

  private listeners = new Set<MetricsListener>()
  private unsubscribers: Array<() => void> = []

  constructor(eventBus?: EventBus) {
    if (eventBus) {
      this.attach(eventBus)
    }
  }

  attach(eventBus: EventBus) {
    // Query lifecycles - track all updates as fetched, and also track success/failure separately
    this.unsubscribers.push(
      eventBus.on('query:updated', (payload) => {
        this.increment('queriesFetched')
        // Track success/failure based on query state
        if (payload.query?.state) {
          const state = payload.query.state
          if (state.status === 'success') {
            this.increment('queriesSucceeded')
          } else if (state.status === 'error') {
            this.increment('queriesFailed')
          }
        }
      }),
      // Mutation lifecycles
      eventBus.on('mutation:started', () => this.increment('mutationsStarted')),
      eventBus.on('mutation:success', () => this.increment('mutationsSucceeded')),
      eventBus.on('mutation:error', () => this.increment('mutationsFailed')),
      // Cache
      eventBus.on('cache:invalidated', () => this.increment('cacheInvalidations')),
      eventBus.on('cache:cleared', () => this.increment('cacheClears'))
    )
  }

  detach() {
    this.unsubscribers.forEach((u) => u())
    this.unsubscribers = []
  }

  subscribe(listener: MetricsListener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): MetricsSnapshot {
    return { ...this.snapshot }
  }

  dispose() {
    this.detach()
    this.listeners.clear()
  }

  private increment(key: keyof MetricsSnapshot) {
    if (key === 'lastUpdatedAt') return
    const current = (this.snapshot as unknown as Record<string, unknown>)[key]
    if (typeof current === 'number') {
      ;(this.snapshot as unknown as Record<string, number>)[key] = current + 1
    }
    this.snapshot.lastUpdatedAt = Date.now()
    this.emit()
  }

  private emit() {
    const snap = this.getSnapshot()
    this.listeners.forEach((l) => l(snap))
  }
}


