// Mutation - Represents a single mutation instance
import type { MutationKey, MutationOptions, MutationState, MutationObserver } from '../types'
import type { EventBus } from '../utils/EventBus'

export class Mutation<TData = unknown, TError = Error, TVariables = unknown, TContext = unknown> {
  public mutationKey: MutationKey
  public mutationHash: string
  public options: MutationOptions<TData, TError, TVariables, TContext>
  public state: MutationState<TData, TError, TVariables, TContext>
  public observers: MutationObserver[] = []
  private eventBus?: EventBus

  setEventBus(eventBus: EventBus) {
    this.eventBus = eventBus
  }

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

  async execute(variables: TVariables): Promise<TData | undefined> {
    if (!this.options.mutationFn) {
      return Promise.resolve(undefined)
    }

    // Update state to loading
    this.state = {
      ...this.state,
      isLoading: true,
      isIdle: false,
      status: 'loading',
      variables,
      submittedAt: Date.now(),
    }

    // Emit mutation:started event
    if (this.eventBus) {
      this.eventBus.emit('mutation:started', { mutation: this as any }, 'normal')
    }

    // Notify observers
    this.notifyObservers()

    // Execute onMutate callback if provided (for optimistic updates)
    let context: TContext | undefined = undefined
    if (this.options.onMutate) {
      try {
        const mutateResult = await this.options.onMutate(variables)
        context = (mutateResult !== undefined ? mutateResult : undefined) as TContext | undefined
        // Store context in state for use in onSuccess/onError
        this.state = {
          ...this.state,
          context,
        }
      } catch (mutateError) {
        // If onMutate fails, continue with mutation
        // Don't update context on error - let mutation proceed and onError will handle it
        // Error is silently handled to avoid console pollution in production
      }
    }

    try {
      // Execute mutation function
      const result = await this.options.mutationFn(variables)

      // Update state to success
      this.state = {
        ...this.state,
        data: result as TData,
        isLoading: false,
        isSuccess: true,
        isError: false,
        status: 'success',
      }

      // Emit mutation:success event
      if (this.eventBus) {
        this.eventBus.emit('mutation:success', { mutation: this as any, data: result }, 'normal')
      }

      // Notify observers
      this.notifyObservers()

      // Call onSuccess callback if provided
      if (this.options.onSuccess) {
        this.options.onSuccess(result as TData, variables, this.state.context)
      }

      // Call onSettled callback if provided (success case)
      if (this.options.onSettled) {
        this.options.onSettled(result as TData, null, variables, this.state.context)
      }

      return result as TData
    } catch (error) {
      const err = error as TError

      // Update state to error
      this.state = {
        ...this.state,
        error: err,
        isLoading: false,
        isSuccess: false,
        isError: true,
        status: 'error',
        failureCount: this.state.failureCount + 1,
        failureReason: err,
      }

      // Emit mutation:error event
      if (this.eventBus) {
        this.eventBus.emit('mutation:error', { mutation: this as any, error: err as Error }, 'normal')
      }

      // Notify observers
      this.notifyObservers()

      // Call onError callback if provided
      if (this.options.onError) {
        this.options.onError(err, variables, this.state.context)
      }

      // Call onSettled callback if provided (error case)
      if (this.options.onSettled) {
        this.options.onSettled(undefined, err, variables, this.state.context)
      }

      throw err
    }
  }

  private notifyObservers() {
    this.observers.forEach(observer => {
      if (observer && typeof (observer as any).onMutationUpdate === 'function') {
        ;(observer as any).onMutationUpdate()
      }
    })
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
