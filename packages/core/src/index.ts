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

// Plugin system
export { PluginManager } from './plugins/PluginManager'
export { persistPlugin } from './plugins/persistPlugin'
export { broadcastPlugin } from './plugins/broadcastPlugin'
export { loggerPlugin } from './plugins/loggerPlugin'
export { devtoolsPlugin } from './plugins/devtoolsPlugin'
