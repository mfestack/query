// Mutation-related types for AppStack Query

export type MutationKey = readonly unknown[]

export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables: TVariables
) => TData | Promise<TData>

export interface MutationOptions<TData = unknown, TError = Error, TVariables = unknown, TContext = unknown> {
  mutationKey?: MutationKey
  mutationFn: MutationFunction<TData, TVariables>
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
  retryDelay?: number | ((retryAttempt: number, error: TError) => number)
  onMutate?: (variables: TVariables) => Promise<TContext | void> | TContext | void
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => Promise<unknown> | unknown
  meta?: MutationMeta
  throwOnError?: boolean | ((error: TError) => boolean)
}

export interface MutationMeta {
  [key: string]: unknown
}

export type MutationStatus = 'idle' | 'loading' | 'error' | 'success'

export interface MutationState<TData = unknown, TError = Error, TVariables = unknown, TContext = unknown> {
  context: TContext | undefined
  data: TData | undefined
  error: TError | null
  failureCount: number
  failureReason: TError | null
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isPaused: boolean
  isSuccess: boolean
  status: MutationStatus
  variables: TVariables | undefined
  submittedAt: number
}

export interface MutationObserverOptions<TData = unknown, TError = Error, TVariables = unknown, TContext = unknown>
  extends MutationOptions<TData, TError, TVariables, TContext> {
  notifyOnChangeProps?: Array<keyof MutationState<TData, TError, TVariables, TContext>> | 'all'
}

export interface MutationFilters {
  mutationKey?: MutationKey
  exact?: boolean
  predicate?: (mutation: Mutation) => boolean
}

export interface MutationCacheNotifyEvent {
  type: 'added' | 'removed' | 'updated'
  mutation: Mutation
}

export interface Mutation {
  mutationKey: MutationKey
  options: MutationOptions
  state: MutationState
  observers: MutationObserver[]
  subscribe: (observer: MutationObserver) => () => void
  execute: (variables: unknown) => Promise<unknown>
  reset: () => void
  remove: () => void
}

export interface MutationObserver {
  options: MutationObserverOptions
  getCurrentResult: () => MutationState
  subscribe: (callback: (result: MutationState) => void) => () => void
  destroy: () => void
}
