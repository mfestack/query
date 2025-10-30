// Mutation - Represents a single mutation instance
import type { MutationKey, MutationOptions, MutationState, MutationObserver } from '../types'

export class Mutation<TData = unknown, TError = Error, TVariables = unknown, TContext = unknown> {
  public mutationKey: MutationKey
  public mutationHash: string
  public options: MutationOptions<TData, TError, TVariables, TContext>
  public state: MutationState<TData, TError, TVariables, TContext>
  public observers: MutationObserver[] = []

  constructor(options: MutationOptions<TData, TError, TVariables, TContext>) {
    this.mutationKey = options.mutationKey || []
    this.mutationHash = this.mutationKey.length > 0 ? JSON.stringify(this.mutationKey) : `mutation_${Date.now()}`
    this.options = options
    this.state = {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: true,
      isLoading: false,
      isPaused: false,
      isSuccess: false,
      status: 'idle',
      variables: undefined,
      submittedAt: 0,
    } as MutationState<TData, TError, TVariables, TContext>
  }

  subscribe(observer: MutationObserver) {
    this.observers.push(observer)
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  async execute(_variables: TVariables): Promise<TData | undefined> {
    // This will be implemented when we create the MutationManager
    return Promise.resolve(undefined)
  }

  reset(): void {
    this.state = {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: true,
      isLoading: false,
      isPaused: false,
      isSuccess: false,
      status: 'idle',
      submittedAt: 0,
      variables: undefined,
    }
  }

  remove(): void {
    // This will be implemented when we create the MutationManager
  }
}
