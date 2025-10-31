import type { QueryClient, QueryKey } from '@mfestack/core'

// Re-export types for convenience
export type TypedEvent<K extends string = string> = {
  type: K
  payload: any
  timestamp?: number
}

export type AppStackEvents = Record<string, any>

export type DevtoolsCoreState = {
  queries: Array<{
    queryKey: QueryKey
    queryHash: string
    status: string
    dataUpdatedAt: number
    error?: Error
    isFetching: boolean
    isStale: boolean
    data?: unknown
  }>
  mutations: Array<{
    mutationHash?: string
    mutationKey?: QueryKey
    status: string
    isPending: boolean
    error?: Error
    data?: unknown
    submittedAt?: number
  }>
  events: TypedEvent<keyof AppStackEvents>[]
}

export type DevtoolsCoreOptions = {
  initialIsOpen?: boolean
  hideDisabledQueries?: boolean
}

export class AppStackDevtoolsCore {
  private client: QueryClient
  private state: DevtoolsCoreState
  private unsubscribeFns: Array<() => void> = []
  private listeners = new Set<(state: DevtoolsCoreState) => void>()

  constructor(client: QueryClient, _options: DevtoolsCoreOptions = {}) {
    this.client = client
    this.state = {
      queries: [],
      mutations: [],
      events: [],
    }

    this.bootstrap()
  }

  setClient(client: QueryClient) {
    this.cleanup()
    this.client = client
    this.bootstrap()
  }

  getState(): DevtoolsCoreState {
    return this.state
  }

  subscribe(listener: (state: DevtoolsCoreState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  refetchQuery(queryKey: QueryKey) {
    return this.client.refetchQueries({ queryKey })
  }

  invalidateQuery(queryKey: QueryKey) {
    return this.client.invalidateQueries({ queryKey })
  }

  removeQuery(queryKey: QueryKey) {
    return this.client.removeQueries({ queryKey })
  }

  clearCache() {
    return this.client.clear()
  }

  private bootstrap() {
    this.updateState()

    const eventBus = (this.client as any).eventBus
    if (!eventBus) return

    this.unsubscribeFns.push(
      eventBus.on('query:added', () => this.updateState()),
      eventBus.on('query:updated', () => this.updateState()),
      eventBus.on('query:removed', () => this.updateState()),
      eventBus.on('mutation:started', () => this.updateState()),
      eventBus.on('mutation:success', () => this.updateState()),
      eventBus.on('mutation:error', () => this.updateState()),
      eventBus.on('cache:invalidated', () => this.updateState()),
      eventBus.on('cache:cleared', () => this.updateState()),
      eventBus.on('query:updated', (payload: any) => {
        this.state = {
          ...this.state,
          events: [
            ...this.state.events.slice(-49),
            { type: 'query:updated', payload, timestamp: Date.now() } as TypedEvent<'query:updated'>,
          ],
        }
        this.emit()
      })
    )
  }

  private updateState() {
    const queries = this.client.queryCache.findAll().map((query: any) => ({
      queryKey: query.queryKey,
      queryHash: query.queryHash,
      status: query.state.status,
      dataUpdatedAt: query.state.dataUpdatedAt,
      error: query.state.error as Error | undefined,
      isFetching: query.state.isFetching,
      isStale: query.state.isStale,
      data: query.state.data,
    }))

    const mutations = this.client.mutationCache.findAll().map((mutation: any) => ({
      mutationHash: mutation.mutationHash,
      mutationKey: mutation.mutationKey,
      status: mutation.state.status,
      isPending: mutation.state.isLoading === true || mutation.state.status === 'loading',
      error: mutation.state.error as Error | undefined,
      data: mutation.state.data,
      submittedAt: mutation.state.submittedAt,
    }))

    this.state = {
      ...this.state,
      queries,
      mutations,
    }
    this.emit()
  }

  private emit() {
    this.listeners.forEach(l => l(this.state))
  }

  private cleanup() {
    this.unsubscribeFns.forEach(unsub => unsub())
    this.unsubscribeFns = []
  }
}
