// LoggerPlugin - Structured logging with EventBus integration and error surfaces
import type { AppStackPlugin, LoggerPluginOptions, StructuredLog, ErrorSurface, LogLevel } from '../types'
import type { QueryClient } from '../types'

const DEFAULT_MAX_ERRORS = 50

export function loggerPlugin(options: LoggerPluginOptions = {}): AppStackPlugin {
  const {
    level = 'info',
    prefix = '[AppStack Query]',
    logger = console,
    enableEventBus = true,
    structured = true,
    errorAggregation = true,
    maxErrors = DEFAULT_MAX_ERRORS,
    filter,
  } = options

  // Normalize level to array for filtering
  const enabledLevels: LogLevel[] = Array.isArray(level) ? level : [level]
  const levelOrder: LogLevel[] = ['debug', 'info', 'warn', 'error']
  
  const shouldLog = (logLevel: LogLevel): boolean => {
    if (enabledLevels.includes('debug')) return true // Debug includes everything
    const logIndex = levelOrder.indexOf(logLevel)
    return enabledLevels.some(enabled => {
      const enabledIndex = levelOrder.indexOf(enabled)
      return logIndex >= enabledIndex
    })
  }

  // Error aggregation storage
  const errorSurfaces = new Map<string, ErrorSurface>()

  const createStructuredLog = (
    logLevel: LogLevel,
    category: string,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): StructuredLog => {
    const structured: StructuredLog = {
      timestamp: Date.now(),
      level: logLevel,
      message,
      category,
    }

    if (data) {
      structured.data = data
    }

    if (error) {
      structured.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    return structured
  }

  const log = (logLevel: LogLevel, category: string, message: string, data?: Record<string, any>, error?: Error) => {
    if (!shouldLog(logLevel)) return

    const structuredLog = createStructuredLog(logLevel, category, message, data, error)

    // Apply custom filter if provided
    if (filter && !filter(structuredLog)) return

    // Handle error aggregation
    if (error && errorAggregation && logLevel === 'error') {
      const errorKey = `${error.name}:${error.message || 'Unknown error'}`
      const existing = errorSurfaces.get(errorKey)
      
      if (existing) {
        existing.count++
        existing.timestamp = Date.now()
        // Update context with latest
        existing.context = { ...existing.context, ...(data || {}) }
      } else {
        // Clean up old errors if we exceed max
        if (errorSurfaces.size >= maxErrors) {
          const firstKey = errorSurfaces.keys().next().value
          if (firstKey) {
            errorSurfaces.delete(firstKey)
          }
        }

        errorSurfaces.set(errorKey, {
          error,
          context: data || {},
          timestamp: Date.now(),
          count: 1,
        })
      }
    }

    // Format and output log
    const shouldUseStructured = structured === true || structured === undefined
    if (shouldUseStructured) {
      const formatted = formatLog(structuredLog)
      
      // Use appropriate logger method based on level
      if (logLevel === 'error') {
        logger.error(formatted)
      } else if (logLevel === 'warn') {
        logger.warn(formatted)
      } else if (logLevel === 'info') {
        logger.log(formatted)
      } else if (logLevel === 'debug') {
        // Debug level - use log or console.debug if available
        if (typeof (logger as any).debug === 'function') {
          (logger as any).debug(formatted)
        } else {
          logger.log(formatted)
        }
      }
    } else {
      // Non-structured logging
      const logMessage = `${prefix} [${category}] ${message}`
      if (error) {
        logger.error(logMessage, data || {}, error)
      } else if (data) {
        if (logLevel === 'debug' && typeof (logger as any).debug === 'function') {
          (logger as any).debug(logMessage, data)
        } else if (logLevel === 'error') {
          logger.error(logMessage, data)
        } else if (logLevel === 'warn') {
          logger.warn(logMessage, data)
        } else {
          logger.log(logMessage, data)
        }
      } else {
        if (logLevel === 'debug' && typeof (logger as any).debug === 'function') {
          (logger as any).debug(logMessage)
        } else if (logLevel === 'error') {
          logger.error(logMessage)
        } else if (logLevel === 'warn') {
          logger.warn(logMessage)
        } else {
          logger.log(logMessage)
        }
      }
    }
  }

  const formatLog = (log: StructuredLog): string => {
    if (!log) {
      return ''
    }

    const timestamp = new Date(log.timestamp).toISOString()
    const levelStr = log.level.toUpperCase().padEnd(5)
    const categoryStr = `[${log.category}]`.padEnd(20)
    let formatted = `${prefix} ${timestamp} ${levelStr} ${categoryStr} ${log.message}`

    if (log.data) {
      formatted += ` ${JSON.stringify(log.data)}`
    }

    if (log.error) {
      formatted += `\n  Error: ${log.error.name}: ${log.error.message}`
      if (log.error.stack) {
        formatted += `\n  ${log.error.stack}`
      }
    }

    return formatted
  }

  // EventBus subscriptions (will be set up in onInit)
  let unsubscribeEventBus: (() => void)[] = []

  const plugin: AppStackPlugin = {
    id: 'logger',
    
    onInit(client: QueryClient) {
      log('info', 'init', 'AppStack Query Client initialized', {
        queryCacheSize: client.queryCache.size,
        mutationCacheSize: client.mutationCache.size,
      })

      // Subscribe to EventBus events if enabled
      if (enableEventBus && client.eventBus) {
        // Query events
        unsubscribeEventBus.push(
          client.eventBus.on('query:added', (payload) => {
            log('debug', 'event', 'query:added', {
              queryKey: payload.query.queryKey,
              queryHash: payload.query.queryHash,
            })
          }),
          client.eventBus.on('query:updated', (payload) => {
            log('info', 'event', 'query:updated', {
              queryKey: payload.query.queryKey,
              status: payload.query.state?.status,
              isFetching: payload.query.state?.isFetching,
              isStale: payload.query.state?.isStale,
            })
          }),
          client.eventBus.on('query:removed', (payload) => {
            log('debug', 'event', 'query:removed', {
              queryKey: payload.query.queryKey,
              queryHash: payload.query.queryHash,
            })
          }),
          
          // Mutation events
          client.eventBus.on('mutation:started', (payload) => {
            log('info', 'event', 'mutation:started', {
              mutationKey: payload.mutation.mutationKey,
            })
          }),
          client.eventBus.on('mutation:success', (payload) => {
            log('info', 'event', 'mutation:success', {
              mutationKey: payload.mutation.mutationKey,
            })
          }),
          client.eventBus.on('mutation:error', (payload) => {
            log('error', 'event', 'mutation:error', {
              mutationKey: payload.mutation.mutationKey,
            }, payload.error)
          }),
          
          // Cache events
          client.eventBus.on('cache:invalidated', (payload) => {
            log('info', 'event', 'cache:invalidated', {
              queryKeys: payload.queryKeys,
            })
          }),
          client.eventBus.on('cache:cleared', () => {
            log('warn', 'event', 'cache:cleared')
          }),
          
          // Persistence events
          client.eventBus.on('persist:hydrated', (payload) => {
            log('info', 'event', 'persist:hydrated', {
              queriesCount: payload.state.queries.length,
              mutationsCount: payload.state.mutations.length,
            })
          }),
          client.eventBus.on('persist:restored', (payload) => {
            log('info', 'event', 'persist:restored', {
              queriesCount: payload.state.queries.length,
              mutationsCount: payload.state.mutations.length,
            })
          }),
          client.eventBus.on('persist:failed', (payload) => {
            log('error', 'event', 'persist:failed', undefined, payload.error)
          })
        )
      }
    },
    
    onQueryAdded(query) {
      log('debug', 'plugin', 'Query added', {
        queryKey: query.queryKey,
        queryHash: query.queryHash,
      })
    },

    onQueryRemoved(query) {
      log('debug', 'plugin', 'Query removed', {
        queryKey: query.queryKey,
        queryHash: query.queryHash,
      })
    },

    onQueryUpdated(query) {
      log('info', 'plugin', 'Query updated', {
        queryKey: query.queryKey,
        status: query.state.status,
        isFetching: query.state.isFetching,
        isStale: query.state.isStale,
      })
    },

    onMutationAdded(mutation) {
      log('debug', 'plugin', 'Mutation added', {
        mutationKey: mutation.mutationKey,
      })
    },

    onMutationRemoved(mutation) {
      log('debug', 'plugin', 'Mutation removed', {
        mutationKey: mutation.mutationKey,
      })
    },

    onMutationUpdated(mutation) {
      log('info', 'plugin', 'Mutation updated', {
        mutationKey: mutation.mutationKey,
        status: mutation.state.status,
        isLoading: mutation.state.isLoading,
      })
    },

    onMutationSuccess(mutation, _data) {
      log('info', 'plugin', 'Mutation success', {
        mutationKey: mutation.mutationKey,
      })
    },

    onMutationError(mutation, error) {
      log('error', 'plugin', 'Mutation error', {
        mutationKey: mutation.mutationKey,
      }, error)
    },

    onCacheUpdate() {
      log('debug', 'plugin', 'Cache updated')
    },

    onHydrate(_client, state) {
      log('info', 'plugin', 'Hydrating cache', {
        queriesCount: state.queries.length,
        mutationsCount: state.mutations.length,
      })
    },

    onDehydrate(_client) {
      log('debug', 'plugin', 'Dehydrating cache')
    },

    onPersist(_client, state) {
      log('info', 'plugin', 'Persisting cache', {
        queriesCount: state.queries.length,
        mutationsCount: state.mutations.length,
      })
    },

    onRestore(_client, state) {
      log('info', 'plugin', 'Restoring cache', {
        queriesCount: state.queries.length,
        mutationsCount: state.mutations.length,
      })
    },

    dispose() {
      // Unsubscribe from EventBus
      unsubscribeEventBus.forEach(unsub => unsub())
      unsubscribeEventBus = []
      
      // Log summary of errors if aggregation was enabled
      if (errorAggregation && errorSurfaces.size > 0) {
        log('warn', 'plugin', `LoggerPlugin disposed. ${errorSurfaces.size} unique errors encountered.`)
        if (enabledLevels.includes('debug')) {
          errorSurfaces.forEach((surface, key) => {
            log('debug', 'plugin', `Error summary: ${key}`, {
              count: surface.count,
              lastOccurrence: new Date(surface.timestamp).toISOString(),
              context: surface.context,
            })
          })
        }
      }
      errorSurfaces.clear()
    },
  }

  // Expose error surfaces for external access
  ;(plugin as any).getErrorSurfaces = (): Map<string, ErrorSurface> => {
    return new Map(errorSurfaces)
  }

  ;(plugin as any).clearErrorSurfaces = (): void => {
    errorSurfaces.clear()
  }

  return plugin
}
