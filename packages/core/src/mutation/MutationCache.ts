// MutationCache - Manages mutation storage and retrieval
import type { MutationKey, MutationOptions, MutationFilters, MutationCacheNotifyEvent, QueryClient, MutationFunction } from '../types'
import type { EventBus } from '../utils/EventBus'
import { Mutation } from './Mutation'
import { hashKey, matchMutation } from '../utils/helpers'
import { Subscribable } from '../utils/Subscribable'

export class MutationCache extends Subscribable<(event: MutationCacheNotifyEvent) => void> {
  private mutations = new Map<string, Mutation>()
  private eventBus?: EventBus

  constructor(eventBus?: EventBus) {
    super()
    this.eventBus = eventBus
  }

  setEventBus(eventBus: EventBus) {
    this.eventBus = eventBus
  }

  find<TData = unknown, TError = Error, TVariables = unknown, TContext = unknown>(
    mutationKey: MutationKey
  ): Mutation<TData, TError, TVariables, TContext> | undefined {
    const mutationHash = hashKey(mutationKey)
    return this.mutations.get(mutationHash) as Mutation<TData, TError, TVariables, TContext> | undefined
  }

  findAll(filters?: MutationFilters): Mutation[] {
    const mutations = Array.from(this.mutations.values())
    
    if (!filters) {
      return mutations
    }

    return mutations.filter(mutation => matchMutation(mutation, filters))
  }

  add<TData, TError, TVariables, TContext>(mutation: Mutation<TData, TError, TVariables, TContext>) {
    const mutationHash = mutation.mutationKey ? hashKey(mutation.mutationKey) : `mutation_${Date.now()}`
    this.mutations.set(mutationHash, mutation as unknown as Mutation<unknown, Error, unknown, unknown>)
    this.notify({ type: 'added', mutation })
    // Note: mutation:started event will be emitted when mutation.execute() is called
  }

  remove<TData, TError, TVariables, TContext>(mutation: Mutation<TData, TError, TVariables, TContext>) {
    const mutationHash = mutation.mutationKey ? hashKey(mutation.mutationKey) : `mutation_${Date.now()}`
    if (this.mutations.delete(mutationHash)) {
      this.notify({ type: 'removed', mutation })
      // Emit EventBus event
      if (this.eventBus) {
        this.eventBus.emit('mutation:removed', { mutation: mutation as any }, 'normal')
      }
    }
  }

  clear() {
    const mutations = Array.from(this.mutations.values())
    this.mutations.clear()
    
    mutations.forEach(mutation => {
      this.notify({ type: 'removed', mutation })
    })
  }

  build<TData, TError, TVariables, TContext>(
    _client: QueryClient,
    options: MutationOptions<TData, TError, TVariables, TContext>
  ): Mutation<TData, TError, TVariables, TContext> {
    const mutationKey = options.mutationKey || []
    const mutationHash = mutationKey.length > 0 ? hashKey(mutationKey) : `mutation_${Date.now()}`
    
    let mutation = this.mutations.get(mutationHash) as Mutation<TData, TError, TVariables, TContext> | undefined

    if (!mutation) {
      // Create new mutation using Mutation class with proper type conversion
      const mutationOptions: MutationOptions<TData, TError, TVariables, TContext> = {
        ...options,
        mutationFn: options.mutationFn as MutationFunction<TData, TVariables>
      }
      mutation = new Mutation<TData, TError, TVariables, TContext>(mutationOptions)
      // Set EventBus reference on mutation for lifecycle events
      if (this.eventBus) {
        mutation.setEventBus(this.eventBus)
      }
      this.add(mutation)
    }

    return mutation
  }

  get size() {
    return this.mutations.size
  }

  get mutationsMap() {
    return this.mutations
  }
}

// Helper function for noop - removed as it's not used
