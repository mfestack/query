// LoggerPlugin - Logs query and mutation lifecycle events
import type { AppStackPlugin, LoggerPluginOptions } from '../types'

export function loggerPlugin(options: LoggerPluginOptions = {}): AppStackPlugin {
  const {
    level = 'log',
    prefix = '[AppStack Query]',
    logger = console,
  } = options

  const log = (message: string, data?: any) => {
    const logMessage = `${prefix} ${message}`
    if (data) {
      logger[level](logMessage, data)
    } else {
      logger[level](logMessage)
    }
  }

  return {
    id: 'logger',
    
    onInit(client) {
      log('AppStack Query Client initialized', client)
    },
    
    onQueryAdded(query) {
      log('Query added', { queryKey: query.queryKey, queryHash: query.queryHash })
    },

    onQueryRemoved(query) {
      log('Query removed', { queryKey: query.queryKey, queryHash: query.queryHash })
    },

    onQueryUpdated(query) {
      log('Query updated', { 
        queryKey: query.queryKey, 
        status: query.state.status,
        isFetching: query.state.isFetching,
        isStale: query.state.isStale,
      })
    },

    onMutationAdded(mutation) {
      log('Mutation added', { mutationKey: mutation.mutationKey })
    },

    onMutationRemoved(mutation) {
      log('Mutation removed', { mutationKey: mutation.mutationKey })
    },

    onMutationUpdated(mutation) {
      log('Mutation updated', { 
        mutationKey: mutation.mutationKey,
        status: mutation.state.status,
        isLoading: mutation.state.isLoading,
      })
    },

    onMutationSuccess(mutation, data) {
      log('Mutation success', { mutationKey: mutation.mutationKey, data })
    },

    onMutationError(mutation, error) {
      log('Mutation error', { mutationKey: mutation.mutationKey, error: error.message })
    },

    onCacheUpdate() {
      log('Cache updated')
    },

    onHydrate(_client, state) {
      log('Hydrating cache', { 
        queriesCount: state.queries.length,
        mutationsCount: state.mutations.length,
      })
    },

    onDehydrate(_client) {
      log('Dehydrating cache')
    },

    onPersist(_client, state) {
      log('Persisting cache', { 
        queriesCount: state.queries.length,
        mutationsCount: state.mutations.length,
      })
    },

    onRestore(_client, state) {
      log('Restoring cache', { 
        queriesCount: state.queries.length,
        mutationsCount: state.mutations.length,
      })
    },
  }
}
