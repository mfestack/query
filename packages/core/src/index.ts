/* istanbul ignore file */

// Re-export all types
export * from './types'

// Core classes and utilities
export { QueryClient } from './client/QueryClient'
export { createQueryClient } from './client/createQueryClient'
export { defaultOptions } from './client/defaultOptions'
export { QueryCache } from './query/QueryCache'
export { Query } from './query/Query'
export { QueryObserver } from './query/QueryObserver'
export { MutationCache } from './mutation/MutationCache'
export { Mutation } from './mutation/Mutation'

// Managers
export { focusManager } from './managers/FocusManager'
export { onlineManager } from './managers/OnlineManager'
export { notifyManager } from './managers/NotifyManager'
export { batchManager } from './managers/BatchManager'
export { retryer } from './managers/Retryer'

// Scheduler
export { TaskScheduler, taskScheduler, BackoffController, defaultBackoffController } from './scheduler'
export type { Task, TaskPriority, TaskId, BackoffStrategy, BackoffOptions } from './scheduler'

// Hydration
export { 
  hydrate, 
  dehydrate, 
  defaultShouldDehydrateQuery, 
  defaultShouldDehydrateMutation 
} from './hydration/hydration'

// Utils
export {
  hashKey,
  isServer,
  replaceEqualDeep,
  shouldThrowError,
  noop,
  matchQuery,
  matchMutation,
  partialMatchKey,
  keepPreviousData,
  skipToken,
  functionalUpdate,
} from './utils/helpers'
export { EventBus, type AppStackEvents, type EventPriority, type TypedEvent, type EventListener } from './utils/EventBus'
export { Metrics, type MetricsSnapshot } from './metrics/Metrics'

// Plugin system
export { PluginManager } from './plugins/PluginManager'
export { persistPlugin } from './plugins/persistPlugin'
export { broadcastPlugin } from './plugins/broadcastPlugin'
export { loggerPlugin } from './plugins/loggerPlugin'
export { devtoolsPlugin } from './plugins/devtoolsPlugin'
